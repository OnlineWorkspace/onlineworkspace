import LOCATION_ON_ICON from "@material-symbols/svg-700/outlined/location_on.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import UKSearchBar from "@ewsgit/uikit-solid/src/components/searchBar/UKSearchBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import AlbumCard from "../../components/AlbumCard";
import MediaCollection from "../../components/MediaCollection";
import { createSelection } from "../../lib/selection";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { createQuery } from "../../lib/useQuery";
import styles from "./Index.module.scss";

const SEARCH_DELAY_MS = 250;

const SearchPage: Component = () => {
  const navigate = useNavigate();
  const selection = createSelection();

  const [search, setSearch] = createSignal("");
  const [query, setQuery] = createSignal("");

  createEffect(
    on(search, (value) => {
      const timeout = setTimeout(() => setQuery(value.trim()), SEARCH_DELAY_MS);
      onCleanup(() => clearTimeout(timeout));
    }),
  );

  const albums = createQuery(
    () => true,
    () => trpc.albums.list.query(),
  );

  const places = createQuery(
    () => true,
    () => trpc.places.query(),
  );

  const media = createQuery(
    () => (query() === "" ? undefined : { scope: "all" as const, query: query() }),
    (input) => trpc.media.list.query(input),
  );

  const needle = () => query().toLowerCase();
  const matchingAlbums = () => (albums.data()?.albums ?? []).filter((album) => album.name.toLowerCase().includes(needle()));
  const matchingPlaces = () => (places.data()?.places ?? []).filter((place) => place.name.toLowerCase().includes(needle()));

  return (
    <>
      <div class={styles.header}>
        <UKSearchBar value={search} placeholder="Search photos, albums and places" leadingIcon={SEARCH_ICON} onValueChange={setSearch} onSubmit={(value) => setQuery(value.trim())} />
      </div>

      <Show
        when={query() !== ""}
        fallback={
          <div class={styles.page}>
            <Show when={(places.data()?.places.length ?? 0) > 0}>
              <UKText role="label" size="l" class={styles.heading}>
                Places
              </UKText>
              <div class={styles.chips}>
                <For each={places.data()?.places}>
                  {(place) => (
                    <UKChip type="suggestion" leading={{ type: "icon", value: LOCATION_ON_ICON }} onClick={() => setSearch(place.name)}>
                      {place.name}
                    </UKChip>
                  )}
                </For>
              </div>
            </Show>

            <Show when={(albums.data()?.albums.length ?? 0) > 0}>
              <UKText role="label" size="l" class={styles.heading}>
                Albums
              </UKText>
              <div class={styles.albums}>
                <For each={albums.data()?.albums}>{(album) => <AlbumCard album={album} onClick={() => navigate(routes.album(album.id))} />}</For>
              </div>
            </Show>

            <UKText role="body" size="m" class={styles.hint}>
              Search by file name, description, location or camera.
            </UKText>
          </div>
        }
      >
        <Show when={matchingAlbums().length > 0}>
          <UKText role="label" size="l" class={styles.heading}>
            Albums
          </UKText>
          <div class={styles.albums}>
            <For each={matchingAlbums()}>{(album) => <AlbumCard album={album} onClick={() => navigate(routes.album(album.id))} />}</For>
          </div>
        </Show>

        <Show when={matchingPlaces().length > 0}>
          <UKText role="label" size="l" class={styles.heading}>
            Places
          </UKText>
          <div class={styles.chips}>
            <For each={matchingPlaces()}>
              {(place) => (
                <UKChip type="suggestion" leading={{ type: "icon", value: LOCATION_ON_ICON }} onClick={() => setSearch(place.name)}>
                  {place.name}
                </UKChip>
              )}
            </For>
          </div>
        </Show>

        <UKText role="label" size="l" class={styles.heading}>
          Photos & videos
        </UKText>
        <MediaCollection
          items={media.data()?.items}
          loading={media.loading()}
          error={media.error()}
          selection={selection}
          empty={{ icon: SEARCH_ICON, title: "No matching photos", body: `Nothing matches “${query()}”.` }}
        />
      </Show>
    </>
  );
};

export default SearchPage;
