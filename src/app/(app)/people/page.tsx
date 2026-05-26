import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await requireTenant();
  const { q, status } = await searchParams;

  const people = await withTenant(ctx.organizationId, (tx) =>
    tx.person.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as "ACTIVE" } : {}),
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, family: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
    }),
  );

  return (
    <>
      <PageHeader
        title="People"
        description="Your church directory"
        actions={
          <Link
            href="/people/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Add Person
          </Link>
        }
      />
      <div className="p-6">
        <form className="mb-4 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select
            name="status"
            defaultValue={status ?? "ACTIVE"}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Filter
          </button>
        </form>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Phone</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {people.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No people yet.{" "}
                    <Link href="/people/new" className="underline">
                      Add the first one
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/people/${p.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {p.preferredName ?? p.firstName} {p.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{p.email ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{p.mobilePhone ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
