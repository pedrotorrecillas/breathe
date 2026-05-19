import type { ATSProviderKey } from "@/domain/ats-integrations/types";
import { mockATSAdapter } from "@/lib/ats-integrations/adapters/mock";
import type { ATSAdapter } from "@/lib/ats-integrations/adapters/types";
import { zohoRecruitAdapter } from "@/lib/ats-integrations/adapters/zoho-recruit";

const adapters: Record<ATSProviderKey, ATSAdapter | null> = {
  mock_ats: mockATSAdapter,
  zoho_recruit: zohoRecruitAdapter,
  recruitee: null,
  ashby: null,
  teamtailor: null,
  greenhouse: null,
  lever: null,
  kombo: null,
};

export function getATSAdapter(provider: ATSProviderKey): ATSAdapter {
  const adapter = adapters[provider];

  if (!adapter) {
    throw new Error(`ATS provider ${provider} is not implemented yet.`);
  }

  return adapter;
}
