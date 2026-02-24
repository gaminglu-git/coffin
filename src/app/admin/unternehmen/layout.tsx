import { UnternehmenTabNav } from "@/components/admin/UnternehmenTabNav";

export default function UnternehmenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <UnternehmenTabNav />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
