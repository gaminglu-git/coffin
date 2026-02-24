import { getPublicEvents } from "@/app/actions/events";
import {
  getCompanySettings,
  getPageContent,
  type PageContent,
} from "@/app/actions/company-settings";
import { Navbar } from "@/components/public/Navbar";
import { TermineClient } from "@/components/public/TermineClient";

export const dynamic = "force-dynamic";

export default async function TerminePage() {
  const [events, companySettings, pageContent] = await Promise.all([
    getPublicEvents(),
    getCompanySettings(),
    getPageContent("/termine"),
  ]);

  return (
    <>
      <Navbar
        displayName={companySettings.displayName}
        tagline={companySettings.tagline}
      />
      <TermineClient
        events={events}
        companySettings={companySettings}
        pageContent={pageContent}
      />
    </>
  );
}
