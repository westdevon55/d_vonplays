import { PageHeader } from "../../_components/PageHeader";
import { FamilyForm } from "../_components/FamilyForm";
import { createFamilyAction } from "../actions";

export default function NewFamilyPage() {
  return (
    <>
      <PageHeader title="Add Family" />
      <div className="p-6">
        <FamilyForm action={createFamilyAction} submitLabel="Create family" />
      </div>
    </>
  );
}
