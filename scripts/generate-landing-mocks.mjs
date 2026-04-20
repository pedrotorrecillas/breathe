import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const refsDir = path.join(rootDir, "Refs");

const model = "fal-ai/flux-2-pro";

const variants = [
  {
    id: "warehouse-aisle-documentary",
    prompt: [
      "Photorealistic documentary-style editorial photograph of a real high-volume frontline work environment.",
      "Show a tall warehouse aisle with repeated shelving, pallets, boxes, fluorescent ceiling lights, long depth, and slight human presence in the distance.",
      "Observed, candid, operational, not staged, not polished.",
      "Early-2000s editorial photo feeling, slightly imperfect framing, believable ambient light, tactile surfaces, subtle grain, realistic color, physical atmosphere.",
      "Shot on Kodak Portra 400 with some CineStill 400D character, Leica M6, 35mm lens.",
      "Fine film grain, subtle halation, slightly deeper blacks, gentle motion blur where natural.",
      "No text overlays, no numbers, no labels added by the model, no dashboards, no floating UI, no holograms, no laptops, no command-center aesthetics, no glossy futuristic lighting, no staged corporate stock photo.",
      "Landscape composition for a landing page hero, tightly composed, highly realistic.",
    ].join(" "),
  },
  {
    id: "loading-dock-observed",
    prompt: [
      "Photorealistic documentary-style editorial photograph of a real high-volume frontline work environment.",
      "Show a loading dock or back-of-house industrial entrance with pallets, concrete, worn surfaces, open bay, muted daylight, and operational stillness with subtle movement.",
      "Observed, candid, and real rather than polished.",
      "Early-2000s editorial photo feeling, tactile surfaces, believable imperfections, restrained contrast, subtle grain, realistic color.",
      "Shot on Kodak Portra 400 with some CineStill 400D character, Contax G2, 35mm lens.",
      "Fine film grain, subtle halation, slightly deeper blacks, natural blur where appropriate, muted warm industrial palette.",
      "No text overlays, no numbers, no labels added by the model, no dashboards, no floating UI, no holograms, no laptops, no command-center aesthetics, no staged corporate stock photo.",
      "Landscape composition for a landing page hero, tightly composed, highly realistic.",
    ].join(" "),
  },
  {
    id: "kitchen-line-candid",
    prompt: [
      "Photorealistic documentary-style editorial photograph of a real high-volume frontline work environment.",
      "Show a kitchen line or service counter during prep, stainless steel, heat, clutter, gestures, candid staff, and tight crop.",
      "Workers must feel natural, busy, and unposed, secondary to the sense of operational flow.",
      "Observed, real, slightly imperfect, more documentary than campaign.",
      "Early-2000s editorial photo feeling, believable ambient light, tactile surfaces, subtle grain, realistic color, physical atmosphere.",
      "Shot on Kodak Portra 400 with some CineStill 400D character, Leica M6, 35mm lens.",
      "Fine film grain, subtle halation, slightly deeper blacks, gentle motion blur in hands or small actions, realism first.",
      "No text overlays, no numbers, no labels added by the model, no dashboards, no floating UI, no holograms, no laptops, no command-center aesthetics, no staged corporate stock photo.",
      "Landscape composition for a landing page hero, tightly composed, highly realistic.",
    ].join(" "),
  },
  {
    id: "production-line-rhythm",
    prompt: [
      "Photorealistic documentary-style editorial photograph of a real high-volume frontline work environment.",
      "Show a repetitive production or conveyor environment with strong linear perspective, moving objects, industrial materials, cool practical light, and visible rhythm.",
      "Observed, candid, operational, and real.",
      "Early-2000s editorial photo feeling, believable imperfections, tactile surfaces, subtle grain, realistic color, slightly imperfect framing.",
      "Shot on Kodak Portra 400 with some CineStill 400D character, Contax G2, 35mm lens.",
      "Fine film grain, subtle halation, slightly deeper blacks, stronger motion blur in moving objects, realism first.",
      "No text overlays, no numbers, no labels added by the model, no dashboards, no floating UI, no holograms, no laptops, no command-center aesthetics, no staged corporate stock photo.",
      "Landscape composition for a landing page hero, tightly composed, highly realistic.",
    ].join(" "),
  },
];

async function generateForVariant(variant) {
  const result = await fal.subscribe(model, {
    input:
      {
        prompt: variant.prompt,
        image_size: "landscape_16_9",
        output_format: "jpeg",
        enable_safety_checker: true,
      },
    logs: true,
    onQueueUpdate(update) {
      if (update.status === "IN_PROGRESS") {
        for (const log of update.logs ?? []) {
          console.log(`[${variant.id}] ${log.message}`);
        }
      }
    },
  });

  return result;
}

async function main() {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("Missing FAL_KEY. Set it in your environment before running this script.");
  }

  fal.config({ credentials: falKey });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(refsDir, `fal-landing-mock-results-${timestamp}.json`);
  const results = [];

  for (const variant of variants) {
    const result = await generateForVariant(variant);
    results.push({
      id: variant.id,
      model,
      prompt: variant.prompt,
      requestId: result.requestId,
      data: result.data,
    });
    console.log(`[${variant.id}] done`);
  }

  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved results to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  if (error?.body) {
    console.error(JSON.stringify(error.body, null, 2));
  }
  process.exitCode = 1;
});
