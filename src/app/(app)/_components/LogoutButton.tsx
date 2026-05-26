"use client";
import { logoutAction } from "../_actions/logout";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
      >
        Sign out
      </button>
    </form>
  );
}
