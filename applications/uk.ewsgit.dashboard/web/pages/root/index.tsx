import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, createSignal, For } from "solid-js";
import trpc from "../../lib/trpc";
import Widgets from "../../widgets/widgets";
import styles from "./index.module.scss";

const RootPage: Component = () => {
  const navigate = useNavigate();
  const [widgets] = createResource(() => trpc.dashboard.getWidgets.query());
  const [welcomeMessage] = createResource(() => trpc.dashboard.getWelcomeMessage.query(Date.now()));
  const [showEditButton] = createResource(() => trpc.dashboard.getShowEditButton.query());
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
      <div class={styles.widgets}>
        <For each={widgets()}>
          {(widgetId) => {
            // @ts-ignore
            const Widget = Widgets[widgetId];

            if (!Widget)
              return (
                <UKText role={"body"} size="l" align={"center"} emphasized>
                  Invalid WidgetId '{widgetId}'
                </UKText>
              );

            return <Widget />;
          }}
        </For>
      </div>
      {showEditButton() && (
        <div class={styles.actionButtons}>
          <UKButton
            leadingIcon={EDIT_ICON}
            onClick={() => {
              navigate("/app/uk.ewsgit.dashboard/edit");
            }}
            color={"tonal"}
          >
            Edit
          </UKButton>
          <UKIconButton
            alt="open settings"
            icon={SETTINGS_ICON}
            onClick={() => {
              navigate("/app/uk.ewsgit.settings/applications/uk.ewsgit.dashboard?origin=/app/uk.ewsgit.dashboard&sidebar_hidden=true");
            }}
            color={"tonal"}
          />
        </div>
      )}
    </>
  );
};

export default RootPage;
