"use client";
import { useRouter } from "next/navigation";
import { switchOrgAction } from "../_actions/switchOrg";

export function OrgSwitcher({
  current,
  options,
}: {
  current: { id: string; name: string; role: string };
  options: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  if (options.length <= 1) {
    return (
      <div className="mt-2">
        <div className="text-sm font-medium text-slate-900">{current.name}</div>
        <div className="text-xs text-slate-500">{current.role}</div>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <select
        value={current.id}
        onChange={async (e) => {
          await switchOrgAction(e.target.value);
          router.refresh();
        }}
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <div className="mt-1 text-xs text-slate-500">{current.role}</div>
    </div>
  );
}
