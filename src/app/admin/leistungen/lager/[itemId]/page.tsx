import { InventoryItemDetail } from "@/components/admin/InventoryItemDetail";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return <InventoryItemDetail itemId={itemId} />;
}
