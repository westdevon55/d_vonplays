import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { createTemplateAction } from "../actions";

export default async function TemplatesPage() {
  const ctx = await requireTenant();
  const templates = await withTenant(ctx.organizationId, (tx) =>
    tx.messageTemplate.findMany({ orderBy: { createdAt: "desc" } }),
  );
  const canWrite = hasPermission(ctx.role, "messages:send");
  return (
    <>
      <PageHeader title="Message Templates" description="Reusable email + SMS templates" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {templates.length === 0 && (
            <p className="text-sm text-slate-500">No templates yet.</p>
          )}
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex justify-between">
                <div className="font-medium">{t.name}</div>
                <span className="text-xs text-slate-500">{t.channel}</span>
              </div>
              {t.subject && (
                <div className="mt-1 text-xs text-slate-500">Subject: {t.subject}</div>
              )}
              <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{t.body}</div>
            </div>
          ))}
        </div>
        {canWrite && (
          <form action={createTemplateAction} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit">
            <h3 className="font-medium">New template</h3>
            <label className="block">
              <span className="text-xs text-slate-600">Name</span>
              <input name="name" required className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Channel</span>
              <select name="channel" defaultValue="EMAIL" className="input mt-1">
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Subject</span>
              <input name="subject" className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Body</span>
              <textarea name="body" rows={5} required className="input mt-1" />
            </label>
            <button className="btn w-full">Create template</button>
          </form>
        )}
      </div>
    </>
  );
}
