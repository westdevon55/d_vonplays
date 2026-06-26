"use server";

/**
 * Custom / booklet quote requests.
 *
 * In production these would be persisted (Supabase) and emailed to
 * orders@euphoriaprint.com. Here we validate, log server-side, and return a
 * friendly result so the form works end-to-end without external services
 * configured. Swap the `deliver()` body for Supabase insert + Resend email.
 */

import { z } from "zod";

const RequestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  phone: z.string().trim().max(40).optional(),
  kind: z.enum(["custom", "booklet"]).default("custom"),
  product: z.string().trim().max(80).optional(),
  quantity: z.string().trim().max(40).optional(),
  pages: z.string().trim().max(40).optional(),
  details: z.string().trim().min(1, "Tell us a bit about the job.").max(4000),
});

export interface QuoteRequestResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

async function deliver(data: z.infer<typeof RequestSchema>): Promise<void> {
  // Placeholder for Supabase insert + email to orders@euphoriaprint.com.
  console.log("[quote-request]", JSON.stringify(data));
}

export async function submitQuoteRequest(
  _prev: QuoteRequestResult | null,
  formData: FormData,
): Promise<QuoteRequestResult> {
  const parsed = RequestSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? undefined,
    kind: formData.get("kind") ?? "custom",
    product: formData.get("product") ?? undefined,
    quantity: formData.get("quantity") ?? undefined,
    pages: formData.get("pages") ?? undefined,
    details: formData.get("details") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await deliver(parsed.data);
    return {
      ok: true,
      message:
        "Thanks! Your request is in — our team will reply with a quote shortly.",
    };
  } catch {
    return {
      ok: false,
      message: "Something went wrong sending your request. Please try again.",
    };
  }
}
