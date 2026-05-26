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

const EventInput = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  capacity: z.string().optional().or(z.literal("")),
  registrationOpen: z.string().optional(),
  isPublic: z.string().optional(),
});

export async function createEventAction(formData: FormData): Promise<void> {
  const ctx = await requireTenant();
  requirePermission(ctx, "events:write");
  const data = EventInput.parse(Object.fromEntries(formData));
  const ev = await withTenant(ctx.organizationId, (tx) =>
    tx.event.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        description: norm(data.description),
        location: norm(data.location),
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        capacity: normNum(data.capacity),
        registrationOpen: data.registrationOpen === "on" || data.registrationOpen === "true",
        isPublic: data.isPublic === "on" || data.isPublic === "true",
      },
    }),
  );
  revalidatePath("/events");
  redirect(`/events/${ev.id}`);
}

export async function registerForEventAction(
  eventId: string,
  formData: FormData,
): Promise<void> {
  const ctx = await requireTenant();
  const personId = norm(formData.get("personId"));
  const attendees = Math.max(1, Math.min(20, Number(formData.get("attendees") ?? 1) || 1));
  await withTenant(ctx.organizationId, (tx) =>
    tx.eventRegistration.create({
      data: { eventId, personId, attendees },
    }),
  );
  revalidatePath(`/events/${eventId}`);
}
