import { notFound } from "next/navigation";
import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import {
  addFormFieldAction,
  deleteFormFieldAction,
  publishFormAction,
} from "../actions";
import { formatDateTime } from "@/lib/utils";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();
  const data = await withTenant(ctx.organizationId, (tx) =>
    tx.form.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { position: "asc" } },
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { person: true },
        },
      },
    }),
  );
  if (!data) notFound();
  const canWrite = hasPermission(ctx.role, "forms:write");
  return (
    <>
      <PageHeader
        title={data.title}
        description={
          data.isPublished
            ? `Public URL: /f/${data.slug}`
            : "Draft — not visible publicly"
        }
        actions={
          canWrite ? (
            <form action={publishFormAction.bind(null, id, !data.isPublished)}>
              <button className="btn btn-secondary">
                {data.isPublished ? "Unpublish" : "Publish"}
              </button>
            </form>
          ) : null
        }
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              Fields
            </h2>
            <ol className="space-y-2">
              {data.fields.length === 0 && (
                <li className="text-sm text-slate-500">No fields yet.</li>
              )}
              {data.fields.map((f, i) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 flex justify-between"
                >
                  <div>
                    <div className="text-xs text-slate-400">
                      {i + 1} · {f.kind}
                      {f.required ? " · required" : ""}
                    </div>
                    <div className="font-medium">{f.label}</div>
                    {f.options.length > 0 && (
                      <div className="text-xs text-slate-500">
                        Options: {f.options.join(", ")}
                      </div>
                    )}
                  </div>
                  {canWrite && (
                    <form action={deleteFormFieldAction.bind(null, id, f.id)}>
                      <button className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ol>
            {canWrite && (
              <form
                action={addFormFieldAction.bind(null, id)}
                className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                <h3 className="font-medium">Add field</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-slate-600">Label</span>
                    <input name="label" required className="input mt-1" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-slate-600">Type</span>
                    <select name="kind" defaultValue="TEXT" className="input mt-1">
                      <option value="TEXT">Text</option>
                      <option value="TEXTAREA">Textarea</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="NUMBER">Number</option>
                      <option value="DATE">Date</option>
                      <option value="CHECKBOX">Checkbox</option>
                      <option value="SELECT">Select</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs text-slate-600">
                    Options (comma-separated, for Select)
                  </span>
                  <input name="options" className="input mt-1" />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="required" />
                  Required
                </label>
                <button className="btn">Add field</button>
              </form>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
              Submissions ({data.submissions.length})
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Submitted</th>
                    <th className="text-left px-4 py-2 font-medium">Person</th>
                    <th className="text-left px-4 py-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.submissions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        No submissions yet.
                      </td>
                    </tr>
                  )}
                  {data.submissions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-2">
                        {s.person
                          ? `${s.person.firstName} ${s.person.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600 max-w-md truncate">
                        {JSON.stringify(s.data)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <aside className="rounded-xl border border-slate-200 bg-white p-4 h-fit text-sm">
          <div className="font-medium mb-2">Share</div>
          {data.isPublished ? (
            <Link
              href={`/f/${data.slug}`}
              className="text-slate-700 underline break-all"
            >
              /f/{data.slug}
            </Link>
          ) : (
            <p className="text-slate-500">
              Publish the form to get a public URL.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
