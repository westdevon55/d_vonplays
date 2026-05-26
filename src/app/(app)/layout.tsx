import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { dbAdmin } from "@/lib/db";
import { SidebarNav } from "./_components/SidebarNav";
import { OrgSwitcher } from "./_components/OrgSwitcher";
import { LogoutButton } from "./_components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.currentOrgId) redirect("/signup");

  const memberships = await dbAdmin.membership.findMany({
    where: { userId: session.userId },
    include: { organization: true },
  });
  const current = memberships.find(
    (m) => m.organizationId === session.currentOrgId,
  );
  if (!current) redirect("/signup");

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200">
          <Link href="/dashboard" className="block font-semibold text-slate-900">
            Church CMS
          </Link>
          <OrgSwitcher
            current={{
              id: current.organizationId,
              name: current.organization.name,
              role: current.role,
            }}
            options={memberships.map((m) => ({
              id: m.organizationId,
              name: m.organization.name,
            }))}
          />
        </div>
        <SidebarNav role={current.role} />
        <div className="p-4 border-t border-slate-200 mt-auto">
          <div className="text-xs text-slate-500">
            {session.name ?? session.email}
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
