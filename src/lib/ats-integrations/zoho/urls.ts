export function recruitApiBaseUrlForAccountsBaseUrl(accountsBaseUrl: string) {
  try {
    const url = new URL(accountsBaseUrl);
    const host = url.hostname.replace(/^accounts\./, "recruit.");

    return `${url.protocol}//${host}`;
  } catch {
    return "https://recruit.zoho.com";
  }
}

function isGenericZohoApiDomain(value: string) {
  try {
    return new URL(value).hostname.includes("zohoapis");
  } catch {
    return false;
  }
}

export function resolveZohoRecruitApiBaseUrl(input: {
  accountsBaseUrl: string;
  configuredApiBaseUrl: string;
  tokenApiDomain?: string | null;
}) {
  if (
    input.tokenApiDomain &&
    !isGenericZohoApiDomain(input.tokenApiDomain)
  ) {
    return input.tokenApiDomain.replace(/\/+$/, "");
  }

  return (
    input.configuredApiBaseUrl?.trim() ||
    recruitApiBaseUrlForAccountsBaseUrl(input.accountsBaseUrl)
  ).replace(/\/+$/, "");
}
