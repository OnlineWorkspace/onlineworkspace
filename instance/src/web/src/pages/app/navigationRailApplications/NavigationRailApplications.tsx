import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import { useNavigate } from "@solidjs/router";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.jsx";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKList from "@tcsw/uikit-solid/src/components/list/UKList.jsx";
import UKListItem from "@tcsw/uikit-solid/src/components/list/UKListItem.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../../lib/trpc";
import styles from "./NavigationRailApplications.module.scss";

const NavigationRailApplications: Component<{
  expanded: boolean;
  toggle: (text: "applications") => void;
  isToggled: boolean;
}> = (props) => {
  const navigate = useNavigate();
  const [applications] = createResource(() => trpc.app.navigation.getApplications.query());

  return (
    <div class={styles.root} data-expanded={props.expanded}>
      <UKIconButton
        alt={"Toggle Applications"}
        icon={APPS_ICON}
        color={props.isToggled ? "filled" : "standard"}
        shape={props.isToggled ? "square" : "round"}
        onClick={() => {
          props.toggle("applications");
        }}
      />
      {props.isToggled && (
        <div class={styles.drawer}>
          <UKText role={"title"} size="l">
            Applications
          </UKText>
          <UKDivider direction={DividerDirection.horizontal} />
          <div class={styles.appsGrid}>
            <UKList>
              <For each={applications()}>
                {(app) => {
                  return (
                    <UKListItem
                      labelText={app.label}
                      onClick={() => {
                        if (app.location.type === "local") {
                          navigate(app.location.value);
                          props.toggle("applications");
                        } else if (app.location.type === "remote") {
                          window.location.href = app.location.value;
                        }
                      }}
                      supportingText={`(${app.id})`}
                      leading={app.icon}
                    />
                  );
                }}
              </For>
            </UKList>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationRailApplications;
