import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "../_components/PageHeader";
import { sendCampaignAction } from "./actions";
import { formatDateTime } from "@/lib/utils";

export default async function MessagesPage() {
  const ctx = await requireTenant();
  const campaigns = await withTenant(ctx.organizationId, (tx) =>
    tx.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  );
  const canSend = hasPermission(ctx.role, "messages:send");
  return (
    <>
      <PageHeader
        title="Messages"
        description="Email and SMS campaigns"
        actions={
          <Link href="/messages/templates" className="btn btn-secondary">
            Templates
          </Link>
        }
      />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Campaign</th>
                <th className="text-left px-4 py-2 font-medium">Channel</th>
                <th className="text-left px-4 py-2 font-medium">Sent</th>
                <th className="text-left px-4 py-2 font-medium">Failed</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No campaigns sent yet.
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.channel}</td>
                  <td className="px-4 py-2">{c.sentCount}</td>
                  <td className="px-4 py-2 text-red-600">{c.failedCount || ""}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {c.sentAt ? formatDateTime(c.sentAt) : c.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canSend && (
          <form
            action={sendCampaignAction}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 h-fit"
          >
            <h3 className="font-medium">Send a message</h3>
            <label className="block">
              <span className="text-xs text-slate-600">Campaign name</span>
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
              <span className="text-xs text-slate-600">Recipients</span>
              <select name="filterStatus" defaultValue="ACTIVE" className="input mt-1">
                <option value="ACTIVE">Active people</option>
                <option value="ALL">All people</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Subject (email)</span>
              <input name="subject" className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">Body</span>
              <textarea name="body" rows={5} required className="input mt-1" />
            </label>
            <button className="btn w-full">Send now</button>
            <p className="text-xs text-slate-500">
              Without Resend/Twilio keys configured, sends are logged to the
              server console (so the flow can be tested without provider
              accounts).
            </p>
          </form>
        )}
      </div>
    </>
  );
}
