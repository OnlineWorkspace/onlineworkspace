import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import {type Component, createEffect, createResource, createSignal, For, Suspense} from "solid-js";
import trpc from "../../lib/trpc";
import SearchResult from "./components/SearchResult/SearchResult";
import styles from "./Index.module.scss";
import MissingSearchResults from "./components/MissingSearchResults/MissingSearchResults.js";
import {throttle} from "@solid-primitives/scheduled";

const Page: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [results, { refetch: refetchResults, mutate: mutateResults }] = createResource(() => trpc.search.searchFor.query(searchQuery()));
  const throttledSearch = throttle((query: string) => {
    refetchResults();
  }, 250)

  createEffect(() => {
    throttledSearch.clear();
    throttledSearch(searchQuery());
  })

  return (
    <>
      <UKTopAppBar
        type="search"
        onValueChange={(val) => {
          if (val.length > searchQuery().length && results()?.length === 0) {
            setSearchQuery(val);
            mutateResults([]);

            return;
          }

          setSearchQuery(val);
        }}
        value={searchQuery}
        placeholder={"Search Applications"}
      />
      <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner} />}>
        {(results() || [])?.length > 0 ? (
          <div class={styles.resultGrid}>
            <For each={results()}>
              {(result) => {
                return <SearchResult applicationId={result.applicationId} repository={result.repository} />;
              }}
            </For>
          </div>
        ) : (
          <MissingSearchResults
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </Suspense>
    </>
  );
};

export default Page;
