import { PageHeader } from "../../_components/PageHeader";
import { SongForm } from "../_components/SongForm";
import { createSongAction } from "../actions";

export default function NewSongPage() {
  return (
    <>
      <PageHeader title="Add Song" />
      <div className="p-6">
        <SongForm action={createSongAction} submitLabel="Add song" />
      </div>
    </>
  );
}
