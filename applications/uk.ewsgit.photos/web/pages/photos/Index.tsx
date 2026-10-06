import GRID_VIEW_ICON from "@material-symbols/svg-700/outlined/grid_view.svg";
import PHOTO_LIBRARY_ICON from "@material-symbols/svg-700/outlined/photo_library.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import FilterChips, { type PhotoFilter } from "../../components/FilterChips";
import MediaCollection, { selectionActions } from "../../components/MediaCollection";
import MemoryCard from "../../components/MemoryCard";
import SelectionBar from "../../components/SelectionBar";
import { usePhotos } from "../../lib/context";
import { routes } from "../../lib/routes";
import { createSelection } from "../../lib/selection";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const DENSITY_KEY = "uk.ewsgit.photos.density";
const SEARCH_DELAY_MS = 250;

const readDensity = (): "comfortable" | "compact" => {
  try {
    return localStorage.getItem(DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
};

const PhotosPage: Component = () => {
  const photos = usePhotos();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const selection = createSelection();

  const [filter, setFilter] = createSignal<PhotoFilter>("all");
  const [place, setPlace] = createSignal<string | undefined>();
  const [search, setSearch] = createSignal("");
  const [query, setQuery] = createSignal("");
  const [density, setDensity] = createSignal(readDensity());

  // typing waits for a pause before it asks the server
  createEffect(
    on(search, (value) => {
      const timeout = setTimeout(() => setQuery(value.trim()), SEARCH_DELAY_MS);
      onCleanup(() => clearTimeout(timeout));
    }),
  );

  const toggleDensity = () => {
    const next = density() === "compact" ? "comfortable" : "compact";
    setDensity(next);

    try {
      localStorage.setItem(DENSITY_KEY, next);
    } catch {
      // the choice just is not remembered
    }
  };

  const media = createQuery(
    () => ({ scope: filter(), query: query() === "" ? undefined : query(), place: place() }),
    (input) => trpc.media.list.query(input),
  );

  const places = createQuery(
    () => true,
    () => trpc.places.query(),
  );

  const memories = createQuery(
    () => true,
    () => trpc.memories.query(),
  );

  const filtered = () => filter() !== "all" || place() !== undefined || query() !== "";
  const showMemories = () => isMobile() && !filtered() && (memories.data()?.memories.length ?? 0) > 0;

  return (
    <>
      <div class={styles.header}>
        <Show
          when={!selection.active()}
          fallback={
            <SelectionBar
              count={selection.count()}
              onClose={selection.clear}
              actions={selectionActions({ photos, selection, items: media.data()?.items ?? [], kind: "library" })}
            />
          }
        >
          <div class={styles.searchRow}>
            <UKSearchBar class={styles.search} value={search} placeholder="Search your photos" leadingIcon={SEARCH_ICON} onValueChange={setSearch} onSubmit={(value) => setQuery(value.trim())} />
            <Show when={!isMobile()}>
              <UKIconButton color="standard" icon={GRID_VIEW_ICON} alt={density() === "compact" ? "Larger photos" : "Smaller photos"} onClick={toggleDensity} />
            </Show>
          </div>
          <FilterChips
            value={filter()}
            onChange={setFilter}
            places={isMobile() ? undefined : places.data()?.places}
            place={place()}
            onPlaceChange={setPlace}
          />
        </Show>
      </div>

      <Show when={showMemories()}>
        <section class={styles.memories} aria-label="Memories">
          <div class={styles.memoriesHeader}>
            <UKText role="title" size="l">
              Memories
            </UKText>
            <UKButton color="standard" onClick={() => navigate(routes.memories())}>
              See all
            </UKButton>
          </div>
          <div class={styles.memoryRow}>
            <For each={memories.data()?.memories.slice(0, 12)}>{(memory) => <MemoryCard memory={memory} onClick={() => navigate(routes.memory(memory.id))} />}</For>
          </div>
        </section>
      </Show>

      <MediaCollection
        items={media.data()?.items}
        loading={media.loading()}
        error={media.error()}
        selection={selection}
        density={density()}
        scrubber
        empty={
          filtered()
            ? { icon: SEARCH_ICON, title: "No matching photos", body: "Try another search or filter." }
            : {
                icon: PHOTO_LIBRARY_ICON,
                title: "No photos yet",
                body: "Upload photos and videos, or put them in your Photos folder in Files and they will show up here.",
                action: (
                  <UKButton color="filled" leadingIcon={UPLOAD_ICON} onClick={photos.actions.pickAndUpload}>
                    Upload photos
                  </UKButton>
                ),
              }
        }
      />
    </>
  );
};

export default PhotosPage;
