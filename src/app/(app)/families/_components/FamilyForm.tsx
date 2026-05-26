"use client";
import Link from "next/link";

type Defaults = {
  name?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  homePhone?: string | null;
};

export function FamilyForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const d = defaults ?? {};
  return (
    <form action={action} className="space-y-4 max-w-xl">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Family name</span>
        <input name="name" defaultValue={d.name ?? ""} required className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Address line 1</span>
        <input name="addressLine1" defaultValue={d.addressLine1 ?? ""} className="input mt-1" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Address line 2</span>
        <input name="addressLine2" defaultValue={d.addressLine2 ?? ""} className="input mt-1" />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">City</span>
          <input name="city" defaultValue={d.city ?? ""} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">State</span>
          <input name="state" defaultValue={d.state ?? ""} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Postal code</span>
          <input name="postalCode" defaultValue={d.postalCode ?? ""} className="input mt-1" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Country</span>
          <input name="country" defaultValue={d.country ?? ""} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Home phone</span>
          <input name="homePhone" defaultValue={d.homePhone ?? ""} className="input mt-1" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn">{submitLabel}</button>
        <Link href="/families" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
