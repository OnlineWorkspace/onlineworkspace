import KID_STAR_ICON from "@material-symbols/svg-700/outlined/kid_star.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, For, Show } from "solid-js";
import EmptyState from "../../components/EmptyState";
import MemoryCard from "../../components/MemoryCard";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const MemoriesPage: Component = () => {
  const navigate = useNavigate();

  const memories = createQuery(
    () => true,
    () => trpc.memories.query(),
  );

  return (
    <>
      <UKTopAppBar type="small" headline="Memories" />

      <div class={styles.page}>
        <Show
          when={!memories.loading()}
          fallback={
            <div class={styles.centered}>
              <UKCircularProgressIndicator />
            </div>
          }
        >
          <Show
            when={(memories.data()?.memories.length ?? 0) > 0}
            fallback={
              <EmptyState
                icon={KID_STAR_ICON}
                title={memories.error() ? "Could not load your memories" : "No memories yet"}
                body={memories.error() ?? "Memories appear for past months that have at least four photos or videos in them."}
              />
            }
          >
            <div class={styles.grid}>
              <For each={memories.data()?.memories}>{(memory) => <MemoryCard fluid memory={memory} onClick={() => navigate(routes.memory(memory.id))} />}</For>
            </div>
          </Show>
        </Show>
      </div>
    </>
  );
};

export default MemoriesPage;
