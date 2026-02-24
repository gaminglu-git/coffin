import { redirect } from "next/navigation";

export default function VeranstaltungenPage() {
  redirect("/admin/unternehmen/website?tab=veranstaltungen");
}
