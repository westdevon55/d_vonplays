import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { createEventAction } from "../actions";

export default async function NewEventPage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "events:write");
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const end = new Date(now);
  end.setHours(end.getHours() + 1);
  return (
    <>
      <PageHeader title="Create Event" />
      <div className="p-6">
        <form action={createEventAction} className="space-y-4 max-w-xl">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input name="title" required className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea name="description" rows={3} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input name="location" className="input mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Starts</span>
              <input
                name="startAt"
                type="datetime-local"
                required
                defaultValue={now.toISOString().slice(0, 16)}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Ends</span>
              <input
                name="endAt"
                type="datetime-local"
                required
                defaultValue={end.toISOString().slice(0, 16)}
                className="input mt-1"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Capacity</span>
            <input name="capacity" type="number" min="1" className="input mt-1 max-w-xs" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="registrationOpen" defaultChecked />
            Registration open
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" />
            Show on public page
          </label>
          <div className="flex gap-2">
            <button className="btn">Create event</button>
            <Link href="/events" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}
