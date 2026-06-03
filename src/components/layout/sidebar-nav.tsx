"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/district", label: "District Analytics", icon: MapPinned },
  { href: "/mla", label: "MLA Directory", icon: Users },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 px-3">
      {links.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Emblem() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#5c100c] text-primary-foreground shadow-md ring-2 ring-white">
        <span className="text-sm font-bold tracking-tight">UP</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground">Uttar Pradesh</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Media Intelligence
        </p>
      </div>
    </div>
  );
}
