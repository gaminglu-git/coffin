import { HomePageClient } from "@/components/public/HomePageClient";
import { getCompanySettings } from "@/app/actions/company-settings";
import { getPageContent } from "@/app/actions/company-settings";

export default async function Home() {
  const [companySettings, pageContent] = await Promise.all([
    getCompanySettings(),
    getPageContent(),
  ]);
  return (
    <HomePageClient
      companySettings={companySettings}
      pageContent={pageContent}
    />
  );
}
