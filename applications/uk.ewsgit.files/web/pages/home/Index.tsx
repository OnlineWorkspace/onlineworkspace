import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import AUDIO_ICON from "@material-symbols/svg-700/outlined/music_note.svg";
import DESCRIPTION_ICON from "@material-symbols/svg-700/outlined/description.svg";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import PLAY_CIRCLE_ICON from "@material-symbols/svg-700/outlined/play_circle.svg";
import UKFloatingActionButton from "@ewsgit/uikit-solid/src/components/floatingActionButton/UKFloatingActionButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { Navigate, useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, Show } from "solid-js";
import EntryRow from "../../components/EntryRow";
import StorageMeter from "../../components/StorageMeter";
import { useFiles } from "../../lib/context";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { type FileGroup, GROUPS } from "../../lib/types";
import { createListing } from "../../lib/useListing";
import styles from "./Index.module.scss";

const GROUP_ICONS: Record<FileGroup, string> = {
  images: IMAGE_ICON,
  videos: PLAY_CIRCLE_ICON,
  audio: AUDIO_ICON,
  documents: DESCRIPTION_ICON,
};

const RECENT_ON_HOME = 4;

/** The phone landing page. On desktop the sidebar replaces it, so it just opens the home folder. */
const MobileHome: Component = () => {
  const navigate = useNavigate();
  const { actions } = useFiles();
  const [query, setQuery] = createSignal("");

  const recent = createListing(
    () => true,
    () => trpc.recent.query(),
  );

  const search = (value: string) => {
    if (value.trim()) navigate(`${routes.browse("/")}?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <div class={styles.root}>
      <UKSearchBar
        value={query}
        placeholder="Search files"
        onValueChange={setQuery}
        onSubmit={search}
        leadingButton={{ icon: MENU_ICON, accessibleLabel: "Places", onClick: actions.openPlaces }}
        trailingElements={<UKIconButton color="tonal" shape="round" icon={PERSON_ICON} alt="Your account" onClick={() => navigate("/app/uk.ewsgit.settings/")} />}
      />

      <StorageMeter action={{ label: "Free up space", onClick: () => navigate(routes.trash()) }} />

      <UKText role="title" size="m" class={styles.heading}>
        Categories
      </UKText>
      <div class={styles.categories}>
        <For each={GROUPS}>
          {(group) => (
            <button type="button" class={styles.category} data-group={group.id} onClick={() => navigate(routes.group(group.id))}>
              <UKIcon>{GROUP_ICONS[group.id]}</UKIcon>
              <UKText role="label" size="l">
                {group.label}
              </UKText>
            </button>
          )}
        </For>
      </div>

      <div class={styles.recentHeader}>
        <UKText role="title" size="m">
          Recent
        </UKText>
        <button type="button" class={styles.seeAll} onClick={() => navigate(routes.recent())}>
          See all
        </button>
      </div>
      <Show when={!recent.error()} fallback={<UKText role="body" size="m">{recent.error()}</UKText>}>
        <For each={recent.data()?.filter((entry) => entry.kind === "file").slice(0, RECENT_ON_HOME)} fallback={<UKText role="body" size="m" class={styles.muted}>{recent.loading() ? "Loading…" : "No files yet"}</UKText>}>
          {(entry) => <EntryRow entry={entry} />}
        </For>
      </Show>

      <UKFloatingActionButton class={styles.fab} icon={ADD_ICON} alt="New" onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        actions.openNewMenu(rect.right - 248, rect.top - 4 * 44 - 32, "/");
      }} />
    </div>
  );
};

const HomePage: Component = () => {
  const isMobile = useIsMobile();

  return (
    <Show when={isMobile()} fallback={<Navigate href={routes.browse("/")} />}>
      <MobileHome />
    </Show>
  );
};

export default HomePage;
