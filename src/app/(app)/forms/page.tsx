import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../_components/PageHeader";
import { createFormAction } from "./actions";

export default async function FormsPage() {
  const ctx = await requireTenant();
  const forms = await withTenant(ctx.organizationId, (tx) =>
    tx.form.findMany({
      include: { _count: { select: { submissions: true, fields: true } } },
      orderBy: { createdAt: "desc" },
    }),
  );
  const canWrite = hasPermission(ctx.role, "forms:write");
  return (
    <>
      <PageHeader title="Forms" description="Public-facing forms that flow into people" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {forms.length === 0 && (
            <p className="text-sm text-slate-500">No forms yet.</p>
          )}
          {forms.map((f) => (
            <Link
              key={f.id}
              href={`/forms/${f.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-xs text-slate-500">/f/{f.slug}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{f.isPublished ? "Published" : "Draft"}</div>
                  <div>{f._count.submissions} submissions</div>
                  <div>{f._count.fields} fields</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {canWrite && (
          <form action={createFormAction} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit">
            <h3 className="font-medium">New form</h3>
            <label className="block">
              <span className="text-xs text-slate-600">Title</span>
              <input name="title" required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Description</span>
              <textarea name="description" rows={3} className="input mt-1" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" />
              Publish immediately
            </label>
            <button className="btn w-full">Create form</button>
          </form>
        )}
      </div>
    </>
  );
}
