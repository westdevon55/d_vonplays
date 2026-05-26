import { notFound } from "next/navigation";
import { dbAdmin } from "@/lib/db";
import { submitFormAction } from "./actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SP = Promise<{ status?: string }>;

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { slug } = await params;
  const { status } = await searchParams;
  // Cross-tenant lookup of a published form by slug → admin client.
  // We never reveal data from non-published forms.
  const form = await dbAdmin.form.findFirst({
    where: { slug, isPublished: true },
    include: {
      fields: { orderBy: { position: "asc" } },
      organization: { select: { name: true } },
    },
  });
  if (!form) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4 text-sm font-medium text-slate-900">
          {form.organization.name}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">{form.title}</h1>
        {form.description && (
          <p className="mt-2 text-sm text-slate-600">{form.description}</p>
        )}
        {status === "ok" ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            Thanks — your response has been recorded.
          </div>
        ) : (
          <form
            action={submitFormAction.bind(null, form.id)}
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6"
          >
            {form.fields.map((f) => (
              <label key={f.id} className="block">
                <span className="text-sm font-medium text-slate-700">
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                <FieldInput field={f} />
              </label>
            ))}
            <button className="btn w-full">Submit</button>
          </form>
        )}
      </main>
    </div>
  );
}

function FieldInput({
  field,
}: {
  field: {
    id: string;
    kind: string;
    required: boolean;
    options: string[];
  };
}) {
  const name = `field_${field.id}`;
  const required = field.required;
  switch (field.kind) {
    case "TEXTAREA":
      return <textarea name={name} required={required} rows={4} className="input mt-1" />;
    case "EMAIL":
      return <input type="email" name={name} required={required} className="input mt-1" />;
    case "PHONE":
      return <input type="tel" name={name} required={required} className="input mt-1" />;
    case "NUMBER":
      return <input type="number" name={name} required={required} className="input mt-1" />;
    case "DATE":
      return <input type="date" name={name} required={required} className="input mt-1" />;
    case "CHECKBOX":
      return <input type="checkbox" name={name} className="mt-2 ml-1" />;
    case "SELECT":
      return (
        <select name={name} required={required} className="input mt-1">
          <option value="">— Choose —</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    default:
      return <input type="text" name={name} required={required} className="input mt-1" />;
  }
}
