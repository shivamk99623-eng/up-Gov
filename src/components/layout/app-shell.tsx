import { Separator } from "@/components/ui/separator";
import { SidebarNav, Emblem } from "./sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-[73px] items-center border-b border-border px-5">
          <Emblem />
        </div>
        <div className="py-5">
          <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          <SidebarNav />
        </div>
        <Separator className="my-2" />
        <div className="mt-auto p-5">
          <div className="rounded-lg border border-border bg-secondary/60 p-3">
            <p className="text-xs font-semibold text-foreground">
              Media Monitoring
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Government of Uttar Pradesh · Real-time analysis across YouTube, X
              and online news.
            </p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
