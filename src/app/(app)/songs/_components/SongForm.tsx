"use client";
import Link from "next/link";

type Defaults = {
  title?: string;
  author?: string | null;
  ccliNumber?: string | null;
  defaultKey?: string | null;
  bpm?: number | null;
  lyrics?: string | null;
  chords?: string | null;
};

export function SongForm({
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
    <form action={action} className="space-y-4 max-w-2xl">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Title</span>
        <input name="title" defaultValue={d.title ?? ""} required className="input mt-1" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Author</span>
          <input name="author" defaultValue={d.author ?? ""} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">CCLI #</span>
          <input
            name="ccliNumber"
            defaultValue={d.ccliNumber ?? ""}
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Default key</span>
          <input
            name="defaultKey"
            defaultValue={d.defaultKey ?? ""}
            placeholder="e.g. G"
            className="input mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">BPM</span>
          <input
            name="bpm"
            type="number"
            defaultValue={d.bpm ?? ""}
            className="input mt-1"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Lyrics</span>
        <textarea
          name="lyrics"
          rows={8}
          defaultValue={d.lyrics ?? ""}
          className="input mt-1 font-mono"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Chords</span>
        <textarea
          name="chords"
          rows={8}
          defaultValue={d.chords ?? ""}
          className="input mt-1 font-mono"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn">{submitLabel}</button>
        <Link href="/songs" className="btn btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
