"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";

const SignupInput = z.object({
  orgName: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(12, "Password must be at least 12 characters."),
});

export async function signupAction(
  _prev: { error: string | null } | null,
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = SignupInput.safeParse({
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // Generate a unique slug.
  let slug = slugify(parsed.data.orgName) || "church";
  let suffix = 0;
  while (await db.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(parsed.data.orgName)}-${suffix}`;
  }

  const result = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: parsed.data.orgName,
        slug,
        subscription: {
          create: {
            plan: "trial",
            trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          },
        },
      },
    });
    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "OWNER",
      },
    });

    // Seed default values so the new org isn't empty.
    await tx.peopleCategory.createMany({
      data: [
        { organizationId: org.id, name: "Members" },
        { organizationId: org.id, name: "Visitors" },
        { organizationId: org.id, name: "Staff" },
      ],
    });
    await tx.groupCategory.createMany({
      data: [
        { organizationId: org.id, name: "Small Group" },
        { organizationId: org.id, name: "Ministry Team" },
      ],
    });
    await tx.serviceType.create({
      data: { organizationId: org.id, name: "Sunday Service" },
    });
    await tx.fund.createMany({
      data: [
        { organizationId: org.id, name: "General" },
        { organizationId: org.id, name: "Missions" },
        { organizationId: org.id, name: "Building" },
      ],
    });
    return { org, user };
  });

  await createSession(result.user.id, result.org.id);
  await audit({
    organizationId: result.org.id,
    actorUserId: result.user.id,
    action: "org.create",
    entityType: "Organization",
    entityId: result.org.id,
    metadata: { name: result.org.name },
  });
  redirect("/dashboard");
}
