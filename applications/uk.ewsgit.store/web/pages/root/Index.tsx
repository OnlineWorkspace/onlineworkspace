import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { type Component, createResource, For, Show } from "solid-js";
import trpc from "../../lib/trpc";
import SearchResult from "../search/components/SearchResult/SearchResult";
import ApplicationTile from "./components/ApplicationTile/ApplicationTile";
import FeaturedApplication from "./components/FeaturedApplication/FeaturedApplication";
import styles from "./Index.module.scss";

const DiscoverPage: Component = () => {
  const [promoted] = createResource(() => trpc.homepage.promotedApplications.query());
  const [all] = createResource(() => trpc.search.searchFor.query(""));

  const featured = () => promoted()?.[0];
  const otherPromoted = () => promoted()?.slice(1) ?? [];
  // everything that isn't already shown above
  const remaining = () => (all() ?? []).filter((a) => !promoted()?.some((p) => p.repository === a.repository && p.applicationId === a.applicationId));

  return (
    <div class={styles.page}>
      <UKTopAppBar type="small" headline={"Discover"} />
      <div class={styles.content}>
        <Show when={featured()} fallback={<div class={styles.featuredPlaceholder} />}>
          {(app) => <FeaturedApplication repository={app().repository} applicationId={app().applicationId} />}
        </Show>

        <Show when={otherPromoted().length > 0}>
          <section class={styles.section}>
            <UKStackLabel>Recommended</UKStackLabel>
            <div class={styles.recommended}>
              <For each={otherPromoted()}>{(app) => <SearchResult repository={app.repository} applicationId={app.applicationId} />}</For>
            </div>
          </section>
        </Show>

        <Show when={remaining().length > 0}>
          <section class={styles.section}>
            <UKStackLabel>All applications</UKStackLabel>
            <div class={styles.tiles}>
              <For each={remaining()}>{(app) => <ApplicationTile repository={app.repository} applicationId={app.applicationId} />}</For>
            </div>
          </section>
        </Show>
      </div>
    </div>
  );
};

export default DiscoverPage;
