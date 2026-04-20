import fs from "node:fs";
import path from "node:path";

import {
  loadRuntimeStoreState,
  saveRuntimeStoreState,
} from "@/lib/db/runtime-store";

type CsvRow = Record<string, string>;

const downloadsDir = path.join(process.env.HOME ?? "", "Downloads");
const audioCsvPath = path.join(
  downloadsDir,
  "Untitled spreadsheet - Sheet1.csv",
);
const publicAudioDir = path.join(
  process.cwd(),
  "public",
  "imported-recordings",
  "ai-native-software-engineer",
);
const publicAudioUrlBase = "/imported-recordings/ai-native-software-engineer";

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    process.env[key] = unquoted;
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      current = "";
      rows.push(row);
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...dataRows] = rows;
  return dataRows
    .filter((dataRow) =>
      dataRow.some((value) => normalizeWhitespace(value).length > 0),
    )
    .map((dataRow) => {
      const record: CsvRow = {};
      header.forEach((key, index) => {
        record[key] = dataRow[index] ?? "";
      });
      return record;
    });
}

function listDownloadedAudioFiles() {
  return fs
    .readdirSync(downloadsDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".mp3"))
    .map((fileName) => ({
      fileName,
      absolutePath: path.join(downloadsDir, fileName),
      stats: fs.statSync(path.join(downloadsDir, fileName)),
    }))
    .sort((left, right) => left.stats.mtimeMs - right.stats.mtimeMs);
}

function ensureDir(targetDir: string) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function destinationFileName(leadId: string, originalFileName: string) {
  const extension = path.extname(originalFileName) || ".mp3";
  return `${leadId}${extension.toLowerCase()}`;
}

async function main() {
  loadDotEnvLocal();

  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(audioCsvPath)) {
    throw new Error(`Audio CSV not found at ${audioCsvPath}`);
  }

  const rows = parseCsv(fs.readFileSync(audioCsvPath, "utf8"));
  const audioFiles = listDownloadedAudioFiles();

  if (rows.length !== audioFiles.length) {
    throw new Error(
      `Expected the same number of CSV rows and mp3 files, got ${rows.length} rows and ${audioFiles.length} files.`,
    );
  }

  const state = await loadRuntimeStoreState();
  const jobRuns = state.interviewRuns.filter(
    (run) => run.jobId === "job_ai_native_software_engineer",
  );
  const runByLeadId = new Map(
    jobRuns.map((run) => [run.id.replace(/^run_import_/, ""), run]),
  );

  const mappings = rows.map((row, index) => {
    const leadId = normalizeWhitespace(row["Data Params Lead Id\nOpen menu"]);
    const prospectId = normalizeWhitespace(row["Data Phone Number\nOpen menu"]);
    const candidateName = normalizeWhitespace(
      row["Data Params Name\nOpen menu"],
    );
    const timestamp = normalizeWhitespace(row["Timestamp"]);
    const audioFile = audioFiles[index];

    if (!leadId) {
      throw new Error(`Missing lead id in CSV row ${index + 1}.`);
    }

    const interviewRun = runByLeadId.get(leadId);

    if (!interviewRun) {
      throw new Error(
        `Could not find imported interview run for lead id ${leadId}.`,
      );
    }

    const targetFileName = destinationFileName(leadId, audioFile.fileName);
    const targetAbsolutePath = path.join(publicAudioDir, targetFileName);
    const recordingUrl = `${publicAudioUrlBase}/${targetFileName}`;

    return {
      rowNumber: index + 1,
      leadId,
      prospectId,
      candidateName,
      timestamp,
      sourceAudioFileName: audioFile.fileName,
      sourceAudioAbsolutePath: audioFile.absolutePath,
      targetFileName,
      targetAbsolutePath,
      recordingUrl,
      interviewRunId: interviewRun.id,
      candidateId: interviewRun.candidateId,
      pipelineStage: interviewRun.pipelineStage,
    };
  });

  const nextState = {
    ...state,
    interviewRuns: state.interviewRuns.map((run) => {
      const mapping = mappings.find((item) => item.interviewRunId === run.id);

      if (!mapping) {
        return run;
      }

      return {
        ...run,
        artifacts: {
          ...run.artifacts,
          recordingUrl: mapping.recordingUrl,
        },
      };
    }),
  };

  if (!dryRun) {
    ensureDir(publicAudioDir);

    for (const mapping of mappings) {
      fs.copyFileSync(
        mapping.sourceAudioAbsolutePath,
        mapping.targetAbsolutePath,
      );
    }

    await saveRuntimeStoreState(nextState);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        audioCsvPath,
        publicAudioDir,
        mappedCount: mappings.length,
        sample: mappings.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
