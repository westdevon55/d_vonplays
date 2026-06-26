"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  submitQuoteRequest,
  type QuoteRequestResult,
} from "@/lib/quote-request";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Sending…" : label}
    </button>
  );
}

export function QuoteRequestForm({
  kind = "custom",
  defaultProduct = "",
  defaultQuantity = "",
  submitLabel = "Send request",
}: {
  kind?: "custom" | "booklet";
  defaultProduct?: string;
  defaultQuantity?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<QuoteRequestResult | null, FormData>(
    submitQuoteRequest,
    null,
  );

  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="gradient-brand grid h-12 w-12 place-items-center rounded-full text-white">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h3 className="text-xl font-bold">Request received</h3>
        <p className="max-w-sm text-[var(--color-muted)]">{state.message}</p>
      </div>
    );
  }

  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="card space-y-5 p-6 sm:p-8">
      <input type="hidden" name="kind" value={kind} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" error={err.name} required />
        <Field
          label="Email"
          name="email"
          type="email"
          error={err.email}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone (optional)" name="phone" error={err.phone} />
        <Field
          label={kind === "booklet" ? "Product" : "Product (optional)"}
          name="product"
          defaultValue={defaultProduct}
          error={err.product}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Quantity"
          name="quantity"
          defaultValue={defaultQuantity}
          error={err.quantity}
        />
        {kind === "booklet" && (
          <Field
            label="Page count"
            name="pages"
            placeholder="e.g. 16 pages + cover"
            error={err.pages}
          />
        )}
      </div>

      <div>
        <label className="label" htmlFor="details">
          Project details
        </label>
        <textarea
          id="details"
          name="details"
          rows={5}
          className="input"
          placeholder={
            kind === "booklet"
              ? "Finished size, page count, binding (saddle-stitch / perfect bound), paper, due date…"
              : "Sizes, finishing, paper, due date, anything else we should know…"
          }
        />
        {err.details && <FieldError>{err.details}</FieldError>}
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {state.message}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input"
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-sm text-[var(--color-accent)]">{children}</p>
  );
}
