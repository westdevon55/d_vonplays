import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";
import { formatDateTime } from "@/lib/utils";

export default async function EventsPage() {
  const ctx = await requireTenant();
  const events = await withTenant(ctx.organizationId, (tx) =>
    tx.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { startAt: "desc" },
      take: 100,
    }),
  );
  return (
    <>
      <PageHeader
        title="Events"
        description="Calendar and registrations"
        actions={
          <Link href="/events/new" className="btn">+ Add Event</Link>
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 && (
          <p className="text-sm text-slate-500">No events yet.</p>
        )}
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
          >
            <div className="font-medium text-slate-900">{e.title}</div>
            <div className="mt-1 text-xs text-slate-500">{formatDateTime(e.startAt)}</div>
            {e.location && (
              <div className="mt-1 text-xs text-slate-500">{e.location}</div>
            )}
            <div className="mt-3 text-sm text-slate-600">
              {e._count.registrations} registered
              {e.capacity ? ` / ${e.capacity}` : ""}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {e.isPublic ? "Public" : "Private"} · {e.registrationOpen ? "Open" : "Closed"}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
