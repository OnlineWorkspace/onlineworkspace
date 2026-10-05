import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, createResource, createSignal } from "solid-js";
import trpc from "../../lib/trpc";
import styles from "./index.module.scss";

/** The greeting and search bar shown above the widgets, shared by the dashboard and its editor so both lay out identically. */
const DashboardHeader: Component = () => {
  const [welcomeMessage] = createResource(() => trpc.dashboard.getWelcomeMessage.query(Date.now()));
  const [showSearchBar] = createResource(() => trpc.dashboard.getShowSearchBar.query());
  const [searchBarOpenInNewTab] = createResource(() => trpc.dashboard.getOpenSearchInNewTab.query());
  const [searchBarSearchEngine] = createResource(() => trpc.dashboard.getSearchBarSearchEngine.query());
  const [searchQuery, setSearchQuery] = createSignal("");

  return (
    <>
      {welcomeMessage() && (
        <UKText emphasized role="display" size="l" align="center" class={styles.welcomeMessage}>
          {welcomeMessage()}
        </UKText>
      )}
      {showSearchBar() && (
        <div class={styles.searchBar}>
          <input
            type="text"
            class={styles.searchBarInput}
            placeholder="Search..."
            value={searchQuery()}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
            }}
            onKeyUp={(e) => {
              setSearchQuery(e.currentTarget.value);
              if (e.key === "Enter") {
                const url = searchBarSearchEngine()!.replace("%s", encodeURIComponent(searchQuery()))!;

                if (searchBarOpenInNewTab()) {
                  window.open(url, "_blank");
                } else {
                  window.location.href = url;
                }

                setSearchQuery("");
              }
            }}
          />
          <UKIconButton
            class={styles.searchBarSearch}
            icon={SEARCH_ICON}
            disabled={searchQuery().length === 0}
            shape="square"
            color={"filled"}
            onClick={() => {
              const url = searchBarSearchEngine()!.replace("%s", encodeURIComponent(searchQuery()))!;

              if (searchBarOpenInNewTab()) {
                window.open(url, "_blank");
              } else {
                window.location.href = url;
              }

              setSearchQuery("");
            }}
            alt="search"
          />
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
