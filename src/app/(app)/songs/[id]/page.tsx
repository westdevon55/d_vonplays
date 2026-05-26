import { notFound } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { PageHeader } from "../../_components/PageHeader";
import { SongForm } from "../_components/SongForm";
import { updateSongAction } from "../actions";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireTenant();
  const song = await withTenant(ctx.organizationId, (tx) =>
    tx.song.findUnique({ where: { id } }),
  );
  if (!song) notFound();
  return (
    <>
      <PageHeader title={song.title} description={song.author ?? undefined} />
      <div className="p-6">
        <SongForm
          action={updateSongAction.bind(null, id)}
          defaults={song}
          submitLabel="Save changes"
        />
      </div>
    </>
  );
}
