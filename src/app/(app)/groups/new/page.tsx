import { requireTenant, withTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "../../_components/PageHeader";
import { GroupForm } from "../_components/GroupForm";
import { createGroupAction } from "../actions";

export default async function NewGroupPage() {
  const ctx = await requireTenant();
  requirePermission(ctx, "groups:write");
  const categories = await withTenant(ctx.organizationId, (tx) =>
    tx.groupCategory.findMany({ orderBy: { name: "asc" } }),
  );
  return (
    <>
      <PageHeader title="Add Group" />
      <div className="p-6">
        <GroupForm
          action={createGroupAction}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          submitLabel="Create group"
        />
      </div>
    </>
  );
}
