import { LeistungenTabNav } from "@/components/admin/LeistungenTabNav";

export default function LeistungenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <LeistungenTabNav />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
