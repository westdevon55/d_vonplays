"use client";
import Link from "next/link";

type Defaults = {
  name?: string;
  description?: string | null;
  meetingDay?: string | null;
  meetingTime?: string | null;
  location?: string | null;
  categoryId?: string | null;
  isActive?: boolean;
};

export function GroupForm({
  action,
  defaults,
  categories,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  categories: Array<{ id: string; name: string }>;
  submitLabel: string;
}) {
  const d = defaults ?? {};
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Group name</span>
        <input name="name" defaultValue={d.name ?? ""} required className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={d.description ?? ""}
          className="input mt-1"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Meeting day</span>
          <input
            name="meetingDay"
            defaultValue={d.meetingDay ?? ""}
            placeholder="e.g. Wednesday"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Meeting time</span>
          <input
            name="meetingTime"
            defaultValue={d.meetingTime ?? ""}
            placeholder="e.g. 7:00 PM"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Location</span>
          <input
            name="location"
            defaultValue={d.location ?? ""}
            className="input mt-1"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Category</span>
        <select
          name="categoryId"
          defaultValue={d.categoryId ?? ""}
          className="input mt-1"
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={d.isActive ?? true}
        />
        Active
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn">{submitLabel}</button>
        <Link href="/groups" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
