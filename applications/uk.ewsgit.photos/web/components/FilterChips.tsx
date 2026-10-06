import LOCATION_ON_ICON from "@material-symbols/svg-700/outlined/location_on.svg";
import UKChip from "@ewsgit/uikit-solid/src/components/chip/UKChip.tsx";
import { type Component, For, Show } from "solid-js";
import styles from "./FilterChips.module.scss";

export type PhotoFilter = "all" | "favorites" | "videos" | "screenshots";

const FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "videos", label: "Videos" },
  { id: "screenshots", label: "Screenshots" },
];

const ALL_PLACES = "\u0000all-places";

/** The row of filters under the search bar. Picking the filter that is already on switches back to "All". */
const FilterChips: Component<{
  value: PhotoFilter;
  onChange: (value: PhotoFilter) => void;
  // when given, a "Places" dropdown is added
  places?: { name: string; count: number }[];
  place?: string;
  onPlaceChange?: (place: string | undefined) => void;
}> = (props) => {
  return (
    <div class={styles.root}>
      <For each={FILTERS}>
        {(filter) => (
          <UKChip
            type="filter_deselectable"
            isSelected={props.value === filter.id}
            select={() => props.onChange(props.value === filter.id ? "all" : filter.id)}
          >
            {filter.label}
          </UKChip>
        )}
      </For>

      <Show when={props.places && props.places.length > 0}>
        <UKChip
          type="filter_dropdown"
          placeholderText="Places"
          selectedId={props.place ?? ""}
          items={[{ id: ALL_PLACES, label: "All places" }, ...(props.places ?? []).map((place) => ({ id: place.name, label: place.name, icon: LOCATION_ON_ICON }))]}
          onSelectItem={(id) => props.onPlaceChange?.(id === ALL_PLACES ? undefined : id)}
        />
      </Show>
    </div>
  );
};

export default FilterChips;
