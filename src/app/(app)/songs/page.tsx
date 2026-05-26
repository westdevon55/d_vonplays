import Link from "next/link";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../_components/PageHeader";

type SP = Promise<{ q?: string }>;

export default async function SongsPage({ searchParams }: { searchParams: SP }) {
  const ctx = await requireTenant();
  const { q } = await searchParams;
  const songs = await withTenant(ctx.organizationId, (tx) =>
    tx.song.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { author: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { title: "asc" },
      take: 300,
    }),
  );
  return (
    <>
      <PageHeader
        title="Songs"
        description="Worship song library with lyrics and chords"
        actions={
          <Link href="/songs/new" className="btn">+ Add Song</Link>
        }
      />
      <div className="p-6">
        <form className="mb-4">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search title or author…"
            className="input w-80"
          />
        </form>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Author</th>
                <th className="text-left px-4 py-2 font-medium">Key</th>
                <th className="text-left px-4 py-2 font-medium">CCLI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {songs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No songs in your library yet.
                  </td>
                </tr>
              )}
              {songs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/songs/${s.id}`} className="hover:underline font-medium">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s.author ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{s.defaultKey ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{s.ccliNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
