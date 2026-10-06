import EDIT_ICON from "@material-symbols/svg-700/outlined/edit.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../lib/trpc";
import Widgets, { parseWidgetEntry, type WidgetType } from "../../widgets/widgets";
import WidgetFrame from "../../widgets/WidgetFrame";
import DashboardHeader from "./Header";
import styles from "./index.module.scss";

const RootPage: Component = () => {
  const navigate = useNavigate();
  const [widgets] = createResource(() => trpc.dashboard.getWidgets.query());
  const [showEditButton] = createResource(() => trpc.dashboard.getShowEditButton.query());

  return (
    <>
      <DashboardHeader />
      <div class={styles.widgets}>
        <For each={widgets()}>
          {(entry) => {
            const { type, size, settings } = parseWidgetEntry(entry);
            const Widget = Widgets[type as WidgetType];

            if (!Widget)
              return (
                <UKText role={"body"} size="l" align={"center"} emphasized>
                  Invalid WidgetId '{type}'
                </UKText>
              );

            return (
              <WidgetFrame size={size}>
                <Widget size={size} settings={settings} />
              </WidgetFrame>
            );
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
