import INDETERMINATE_QUESTION_BOX_ICON from "@material-symbols/svg-700/outlined/indeterminate_question_box.svg";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, createResource, createSignal, For, Suspense } from "solid-js";
import trpc from "../../lib/trpc";
import SearchResult from "./components/SearchResult/SearchResult";
import styles from "./Index.module.scss";

const Page: Component = () => {
  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [results, { refetch: refetchResults, mutate: mutateResults }] = createResource(() => trpc.search.searchFor.query(searchQuery()));

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
          refetchResults();
        }}
        value={searchQuery}
        placeholder={"Search Applications"}
      />
      <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
        {(results() || [])?.length > 0 ? (
          <div class={styles.resultGrid}>
            <For each={results()}>
              {(result) => {
                return <SearchResult applicationId={result.applicationId} repository={result.repository} />;
              }}
            </For>
          </div>
        ) : (
          <div class={styles.missingResultsMessage}>
            <UKIcon class={styles.icon}>{INDETERMINATE_QUESTION_BOX_ICON}</UKIcon>
            <UKText role="title" size="l">
              No search results found
            </UKText>
            <UKText role="body" size="l">
              No apps were found which matched '{searchQuery()}'.
            </UKText>
            <UKButton
              class={styles.clearSearchButton}
              onClick={() => {
                setSearchQuery("");
                refetchResults();
              }}
            >
              Reset Search
            </UKButton>
          </div>
        )}
      </Suspense>
    </>
  );
};

export default Page;
