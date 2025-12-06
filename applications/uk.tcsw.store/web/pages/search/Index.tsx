import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { createResource, createSignal, For, on, Suspense, type Component } from "solid-js";
import styles from "./Index.module.scss";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.jsx";
import SearchResult from "./components/SearchResult/SearchResult";
import trpc from "../../lib/trpc";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";

const Page: Component = () => {
    const [searchQuery, setSearchQuery] = createSignal<string>("");
    const [results, { refetch: refetchResults }] = createResource(() => trpc.search.searchFor.query(searchQuery()));

    return (
        <div class={styles.page}>
            <div class={styles.topBar}>
                <UKText role={"title"} size="l">
                    Search
                </UKText>
            </div>
            <UKDivider direction={DividerDirection.horizontal} />
            <div class={styles.content}>
                <UKTextField
                    leadingIcon={{
                        icon: "search",
                        onClick: () => {
                            return 0;
                        },
                    }}
                    getValue={(val) => {
                        if (searchQuery() !== val) {
                            setSearchQuery(val);
                            refetchResults();
                        }
                    }}
                    setValue={searchQuery()}
                    color={"filled"}
                    label={"Search"}
                />
                <UKDivider direction={DividerDirection.horizontal} />
                <div class={styles.resultGrid}>
                    <Suspense fallback={<UKIndeterminateSpinner />}>
                        <For each={results()}>
                            {(result) => {
                                return <SearchResult applicationId={result.applicationId} repository={result.repository} />;
                            }}
                        </For>
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default Page;
