"use client";
import Link from "next/link";

type Option = { id: string; name: string };

export function PersonForm({
  action,
  defaults,
  categories,
  families,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Partial<{
    firstName: string;
    lastName: string;
    preferredName: string | null;
    email: string | null;
    mobilePhone: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    status: string;
    categoryId: string | null;
    familyId: string | null;
    familyRelation: string | null;
    notes: string | null;
  }>;
  categories: Option[];
  families: Option[];
  submitLabel: string;
}) {
  const d = defaults ?? {};
  const dobStr = d.dateOfBirth
    ? new Date(d.dateOfBirth).toISOString().slice(0, 10)
    : "";
  return (
    <form action={action} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          <input
            name="firstName"
            defaultValue={d.firstName ?? ""}
            required
            className="input"
          />
        </Field>
        <Field label="Last name">
          <input
            name="lastName"
            defaultValue={d.lastName ?? ""}
            required
            className="input"
          />
        </Field>
        <Field label="Preferred name">
          <input
            name="preferredName"
            defaultValue={d.preferredName ?? ""}
            className="input"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={d.email ?? ""}
            className="input"
          />
        </Field>
        <Field label="Mobile phone">
          <input
            name="mobilePhone"
            defaultValue={d.mobilePhone ?? ""}
            className="input"
          />
        </Field>
        <Field label="Date of birth">
          <input name="dateOfBirth" type="date" defaultValue={dobStr} className="input" />
        </Field>
        <Field label="Gender">
          <input name="gender" defaultValue={d.gender ?? ""} className="input" />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={d.status ?? "ACTIVE"}
            className="input"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
        <Field label="Category">
          <select
            name="categoryId"
            defaultValue={d.categoryId ?? ""}
            className="input"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Family">
          <select
            name="familyId"
            defaultValue={d.familyId ?? ""}
            className="input"
          >
            <option value="">— None —</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Family relation">
          <select
            name="familyRelation"
            defaultValue={d.familyRelation ?? ""}
            className="input"
          >
            <option value="">—</option>
            <option value="HEAD">Head</option>
            <option value="SPOUSE">Spouse</option>
            <option value="CHILD">Child</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          name="notes"
          defaultValue={d.notes ?? ""}
          rows={3}
          className="input"
        />
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {submitLabel}
        </button>
        <Link
          href="/people"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
