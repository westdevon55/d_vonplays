import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { PersonForm } from "../_components/PersonForm";
import { updatePersonAction, deletePersonAction } from "../actions";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();

  const data = await withTenant(ctx.organizationId, async (tx) => {
    const person = await tx.person.findUnique({
      where: { id },
      include: {
        family: true,
        category: true,
        groupMembers: { include: { group: true } },
        donations: {
          orderBy: { donatedAt: "desc" },
          take: 10,
          include: { fund: true },
        },
      },
    });
    if (!person) return null;
    const [categories, families] = await Promise.all([
      tx.peopleCategory.findMany({ orderBy: { name: "asc" } }),
      tx.family.findMany({ orderBy: { name: "asc" } }),
    ]);
    return { person, categories, families };
  });

  if (!data) notFound();
  const { person, categories, families } = data;
  const canEdit = hasPermission(ctx.role, "people:write");
  const canDelete = hasPermission(ctx.role, "people:delete");
  const canSeeGiving = hasPermission(ctx.role, "giving:read");

  const update = updatePersonAction.bind(null, id);
  const remove = deletePersonAction.bind(null, id);

  return (
    <>
      <PageHeader
        title={`${person.preferredName ?? person.firstName} ${person.lastName}`}
        description={person.email ?? undefined}
        actions={
          canDelete ? (
            <form action={remove}>
              <button className="rounded-md border border-red-300 text-red-700 px-3 py-1.5 text-sm hover:bg-red-50">
                Delete
              </button>
            </form>
          ) : null
        }
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {canEdit ? (
            <PersonForm
              action={update}
              defaults={person}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
              families={families.map((f) => ({ id: f.id, name: f.name }))}
              submitLabel="Save changes"
            />
          ) : (
            <ReadOnlyView person={person} />
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-medium text-slate-900">Groups</div>
            {person.groupMembers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Not in any groups.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {person.groupMembers.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/groups/${m.group.id}`}
                      className="text-slate-700 hover:underline"
                    >
                      {m.group.name} <span className="text-slate-400">— {m.role}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {canSeeGiving && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-medium text-slate-900">Recent Giving</div>
              {person.donations.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No donations.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {person.donations.map((d) => (
                    <li key={d.id} className="flex justify-between">
                      <span className="text-slate-600">
                        {formatDate(d.donatedAt)} · {d.fund.name}
                      </span>
                      <span className="font-medium">
                        {formatMoney(d.amountCents, d.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function ReadOnlyView({
  person,
}: {
  person: { email: string | null; mobilePhone: string | null; notes: string | null };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 space-y-2">
      <div>
        <span className="text-slate-500">Email:</span> {person.email ?? "—"}
      </div>
      <div>
        <span className="text-slate-500">Mobile:</span>{" "}
        {person.mobilePhone ?? "—"}
      </div>
      {person.notes && (
        <div>
          <span className="text-slate-500">Notes:</span> {person.notes}
        </div>
      )}
    </div>
  );
}
