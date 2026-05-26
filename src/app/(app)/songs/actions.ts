"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";

const norm = (v: unknown) =>
  typeof v === "string" && v.trim() !== "" ? v.trim() : null;
const normNum = (v: unknown) => {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const SongInput = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(160).optional().or(z.literal("")),
  ccliNumber: z.string().max(40).optional().or(z.literal("")),
  defaultKey: z.string().max(20).optional().or(z.literal("")),
  bpm: z.string().optional().or(z.literal("")),
  lyrics: z.string().max(20000).optional().or(z.literal("")),
  chords: z.string().max(20000).optional().or(z.literal("")),
});

export async function createSongAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "songs:write");
  const data = SongInput.parse(Object.fromEntries(formData));
  const song = await withTenant(ctx.organizationId, (tx) =>
    tx.song.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        author: norm(data.author),
        ccliNumber: norm(data.ccliNumber),
        defaultKey: norm(data.defaultKey),
        bpm: normNum(data.bpm),
        lyrics: norm(data.lyrics),
        chords: norm(data.chords),
      },
    }),
  );
  revalidatePath("/songs");
  redirect(`/songs/${song.id}`);
}

export async function updateSongAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "songs:write");
  const data = SongInput.parse(Object.fromEntries(formData));
  await withTenant(ctx.organizationId, (tx) =>
    tx.song.update({
      where: { id },
      data: {
        title: data.title,
        author: norm(data.author),
        ccliNumber: norm(data.ccliNumber),
        defaultKey: norm(data.defaultKey),
        bpm: normNum(data.bpm),
        lyrics: norm(data.lyrics),
        chords: norm(data.chords),
      },
    }),
  );
  revalidatePath("/songs");
  revalidatePath(`/songs/${id}`);
}
