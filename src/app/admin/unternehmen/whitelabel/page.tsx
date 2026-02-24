import { redirect } from "next/navigation";

export default function UnternehmenWhitelabelPage() {
  redirect("/admin/unternehmen/website?tab=whitelabel");
}
