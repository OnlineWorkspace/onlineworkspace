import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { createSignal, For, type Component, type ParentProps } from "solid-js";
import styles from "./Layout.module.scss";
import { useNavigate } from "@solidjs/router";

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
            <UKTopAppBar type="search" getValue={setQuery} value={query} placeholder="Begin typing to search" />
            <div class={styles.page}>
                {query() !== "" && (
                    <>
                        <UKStack class={styles.searchResults}>
                            <For each={SEARCH_TYPES}>
                                {(type) => (
                                    <UKStackItem
                                        labelText={`${type.displayName} "${query()}"`}
                                        onClick={() =>
                                            navigate(
                                                `/app/uk.tcsw.photos/search/${type.prefix}/${encodeURIComponent(query())}`,
                                            )
                                        }
                                    />
                                )}
                            </For>
                        </UKStack>
                        <UKDivider
                            class={styles.searchResultsDivider}
                            width="middle-inset"
                            direction={DividerDirection.horizontal}
                        />
                    </>
                )}
                {props.children}
            </div>
        </>
    );
};

export default SearchLayout;
