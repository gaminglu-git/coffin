import {
  getCompanySettings,
  getPageContent,
} from "@/app/actions/company-settings";
import { Navbar } from "@/components/public/Navbar";
import { TeamPageClient } from "@/components/public/TeamPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Unser Team | liebevoll bestatten",
  description:
    "Lernen Sie das Team von minten & walter bestattungen kennen. Ralph Walter, Katrin Lankers, Claudia Fricke und Vivien Hellweg begleiten Sie mit Empathie und Herz.",
};

export default async function TeamPage() {
  const [companySettings, pageContent] = await Promise.all([
    getCompanySettings(),
    getPageContent("/team"),
  ]);

  return (
    <>
      <Navbar
        displayName={companySettings.displayName}
        tagline={companySettings.tagline}
      />
      <TeamPageClient
        companySettings={companySettings}
        pageContent={pageContent}
      />
    </>
  );
}
