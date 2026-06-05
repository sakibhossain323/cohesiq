import type { Contract } from "@/lib/types";
import { fetchApi } from "./client";

export interface ContractCreatePayload {
  contract_type: string;
  payment_structure?: string;
  payment_amount_bdt?: number;
  payment_schedule?: string;
  has_product_transfer?: boolean;
  product_disposition?: string;
  deliverable_notes?: string;
  exclusivity_days?: number;
  usage_rights_days?: number;
  max_revision_rounds?: number;
  kill_fee_percentage?: number;
}

export async function createContract(
  campaignId: string,
  applicationId: string,
  payload: ContractCreatePayload,
  token: string
): Promise<Contract> {
  return fetchApi<Contract>(
    `/campaigns/${campaignId}/applications/${applicationId}/contract`,
    { method: "POST", token, body: JSON.stringify(payload) }
  );
}

export async function getContractByApplication(
  campaignId: string,
  applicationId: string,
  token: string
): Promise<Contract | null> {
  try {
    return await fetchApi<Contract>(
      `/campaigns/${campaignId}/applications/${applicationId}/contract`,
      { token }
    );
  } catch {
    return null;
  }
}

export async function listBrandContracts(
  token: string,
  campaignId?: string
): Promise<Contract[]> {
  const qs = campaignId ? `?campaign_id=${campaignId}` : "";
  try {
    return await fetchApi<Contract[]>(`/campaigns/brands/me/contracts${qs}`, { token });
  } catch {
    return [];
  }
}

export async function listCreatorContracts(token: string): Promise<Contract[]> {
  try {
    return await fetchApi<Contract[]>(`/campaigns/creators/me/contracts`, { token });
  } catch {
    return [];
  }
}

export async function submitContentDraft(
  contractId: string,
  draftContentUrl: string,
  token: string
): Promise<Contract> {
  return fetchApi<Contract>(`/campaigns/contracts/${contractId}/submit-draft`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ draft_content_url: draftContentUrl }),
  });
}

export async function approveContent(contractId: string, token: string): Promise<Contract> {
  return fetchApi<Contract>(`/campaigns/contracts/${contractId}/approve`, {
    method: "PATCH",
    token,
  });
}

export async function requestRevision(contractId: string, token: string): Promise<Contract> {
  return fetchApi<Contract>(`/campaigns/contracts/${contractId}/request-revision`, {
    method: "PATCH",
    token,
  });
}

export async function publishContent(
  contractId: string,
  livePostUrl: string,
  token: string
): Promise<Contract> {
  return fetchApi<Contract>(`/campaigns/contracts/${contractId}/publish`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ live_post_url: livePostUrl }),
  });
}

export async function closeContract(contractId: string, token: string): Promise<Contract> {
  return fetchApi<Contract>(`/campaigns/contracts/${contractId}/close`, {
    method: "PATCH",
    token,
  });
}
