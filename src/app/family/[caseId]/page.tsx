import { FamilyPortalClient } from "@/components/family/FamilyPortalClient";

export default async function FamilyPortalPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <FamilyPortalClient caseId={caseId} />;
}
