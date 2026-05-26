"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { TenantContext } from "@/lib/tenant";

type Role = TenantContext["role"];

const NAV: Array<{
  group?: string;
  label: string;
  href: string;
  perm: Permission;
}> = [
  { label: "Dashboard", href: "/dashboard", perm: "groups:read" },
  { group: "People", label: "People", href: "/people", perm: "people:read" },
  { label: "Families", href: "/families", perm: "people:read" },
  { label: "Groups", href: "/groups", perm: "groups:read" },
  { group: "Worship", label: "Services", href: "/services", perm: "services:read" },
  { label: "Songs", href: "/songs", perm: "songs:read" },
  { label: "My Schedule", href: "/my-schedule", perm: "services:read" },
  { group: "Giving", label: "Donations", href: "/giving", perm: "giving:read" },
  { label: "Funds", href: "/giving/funds", perm: "giving:read" },
  { label: "Give Online", href: "/giving/give", perm: "giving:give" },
  { group: "Engagement", label: "Events", href: "/events", perm: "events:read" },
  { label: "Check-in", href: "/checkin", perm: "checkin:operate" },
  { label: "Messages", href: "/messages", perm: "messages:read" },
  { label: "Forms", href: "/forms", perm: "forms:read" },
  { group: "Admin", label: "Reports", href: "/reports", perm: "reports:read" },
  { label: "Settings", href: "/settings", perm: "org:manage" },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 text-sm">
      {NAV.filter((item) => hasPermission(role, item.perm)).map((item) => (
        <div key={item.href}>
          {item.group && (
            <div className="mt-4 mb-1 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              {item.group}
            </div>
          )}
          <Link
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-slate-100 text-slate-900 font-medium"
                : "",
            )}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
