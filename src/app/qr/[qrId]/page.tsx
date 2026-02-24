import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recordScanAction } from "@/app/actions/inventory";
import { headers } from "next/headers";

export default async function QrScanPage({
  params,
}: {
  params: Promise<{ qrId: string }>;
}) {
  const { qrId } = await params;

  const supabase = await createClient();
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, inventory_item_id")
    .eq("id", qrId)
    .single();

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? undefined;

  await recordScanAction({
    qrId,
    userAgent,
  });

  if (!qr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <h1 className="text-xl font-serif text-gray-800 mb-2">QR-Code unbekannt</h1>
          <p className="text-gray-600">
            Dieser QR-Code wurde nicht gefunden oder ist ungültig.
          </p>
        </div>
      </div>
    );
  }

  const itemId = qr.inventory_item_id;

  if (itemId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirect(`/admin/leistungen/lager/${itemId}?ref=qr`);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user && !itemId) {
    redirect(`/admin/leistungen/lager?link=${qrId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mw-sand p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
        <h1 className="text-xl font-serif text-emerald-900 mb-2">
          minten & walter
        </h1>
        <p className="text-gray-600">
          {itemId
            ? "Scan erfasst. Bitte melden Sie sich an, um die Artikeldetails zu sehen."
            : "Scan erfasst. Dieser QR-Code ist noch keinem Artikel zugeordnet."}
        </p>
        <a
          href="/admin"
          className="inline-block mt-6 text-emerald-900 font-medium hover:underline"
        >
          Zum Mitarbeiter-Login
        </a>
      </div>
    </div>
  );
}
