import {
    createEffect,
    createResource,
    createSignal,
    For,
    Suspense,
    type Component,
} from "solid-js";
import styles from "./Index.module.scss";
import SearchResult from "./components/SearchResult/SearchResult";
import trpc from "../../lib/trpc";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";

const Page: Component = () => {
    const [searchQuery, setSearchQuery] = createSignal<string>("");
    const [results, { refetch: refetchResults }] = createResource(() =>
        trpc.search.searchFor.query(searchQuery()),
    );

    return (
        <>
            <UKTopAppBar
                type="search"
                getValue={(val) => {
                    setSearchQuery(val);
                    refetchResults();
                }}
                value={searchQuery}
                placeholder={"Search Applications"}
            />
            <div class={styles.page}>
                <div class={styles.resultGrid}>
                    <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
                        <For each={results()}>
                            {(result) => {
                                return (
                                    <SearchResult
                                        applicationId={result.applicationId}
                                        repository={result.repository}
                                    />
                                );
                            }}
                        </For>
                    </Suspense>
                </div>
            </div>
        </>
    );
};

export default Page;
