import { Suspense } from "react";
import { UnternehmenWebsiteClient } from "@/components/admin/UnternehmenWebsiteClient";

export default async function UnternehmenWebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await searchParams;
  return (
    <Suspense fallback={<div className="p-4">Lade...</div>}>
      <UnternehmenWebsiteClient />
    </Suspense>
  );
}
