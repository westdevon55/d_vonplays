"use server";
import { switchOrg } from "@/lib/session";

export async function switchOrgAction(orgId: string) {
  await switchOrg(orgId);
}
