import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { PersonForm } from "../_components/PersonForm";
import { createPersonAction } from "../actions";

export default async function NewPersonPage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "people:write");
  const { categories, families } = await withTenant(
    ctx.organizationId,
    async (tx) => ({
      categories: await tx.peopleCategory.findMany({ orderBy: { name: "asc" } }),
      families: await tx.family.findMany({ orderBy: { name: "asc" } }),
    }),
  );
  return (
    <>
      <PageHeader title="Add Person" />
      <div className="p-6">
        <PersonForm
          action={createPersonAction}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          families={families.map((f) => ({ id: f.id, name: f.name }))}
          submitLabel="Create person"
        />
      </div>
    </>
  );
}
