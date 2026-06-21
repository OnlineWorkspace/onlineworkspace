import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, type ParentProps } from "solid-js";
import styles from "./Layout.module.scss";

const SEARCH_TYPES: { displayName: string; prefix: string }[] = [
  { displayName: "Search in people for ", prefix: "people" },
  { displayName: "Search in albums for ", prefix: "albums" },
  { displayName: "Search in places for ", prefix: "places" },
];

const SearchLayout: Component<ParentProps> = (props) => {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal<string>("");

  return (
    <>
      <UKTopAppBar type="search" onValueChange={setQuery} value={query} placeholder="Begin typing to search" />
      <div class={styles.page}>
        {query() !== "" && (
          <>
            <UKStack class={styles.searchResults}>
              <For each={SEARCH_TYPES}>
                {(type) => (
                  <UKStackItem
                    labelText={`${type.displayName} "${query()}"`}
                    onClick={() => navigate(`/app/uk.ewsgit.photos/search/${type.prefix}/${encodeURIComponent(query())}`)}
                  />
                )}
              </For>
            </UKStack>
            <UKDivider class={styles.searchResultsDivider} width="middle-inset" direction={DividerDirection.horizontal} />
          </>
        )}
        {props.children}
      </div>
    </>
  );
};

export default SearchLayout;
