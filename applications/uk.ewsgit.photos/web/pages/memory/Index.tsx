import KID_STAR_ICON from "@material-symbols/svg-700/outlined/kid_star.svg";
import { Navigate, useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import CollectionPage from "../../components/CollectionPage";
import { memoryAge, memoryMonth } from "../../lib/format";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";

const MEMORY_ID = /^\d{4}-(0[1-9]|1[0-2])$/;

const MemoryPage: Component = () => {
  const params = useParams();
  const memoryId = () => (MEMORY_ID.test(params.id ?? "") ? params.id : undefined);

  const memories = createQuery(
    () => true,
    () => trpc.memories.query(),
  );

  const place = () => memories.data()?.memories.find((memory) => memory.id === memoryId())?.place;

  return (
    <>
      {memoryId() === undefined && <Navigate href={routes.memories()} />}

      <CollectionPage
        title={place() ?? (memoryId() ? memoryMonth(memoryId()!) : "Memory")}
        subtitle={memoryId() ? `${place() ? `${memoryMonth(memoryId()!)} · ` : ""}${memoryAge(memoryId()!)}` : undefined}
        query={memoryId() === undefined ? undefined : { scope: "memory", memoryId: memoryId() }}
        kind="library"
        backTo={routes.memories()}
        empty={{ icon: KID_STAR_ICON, title: "Nothing from this month", body: "The photos from this month were moved or deleted." }}
      />
    </>
  );
};

export default MemoryPage;
