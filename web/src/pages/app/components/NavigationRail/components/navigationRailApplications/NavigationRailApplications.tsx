import APPS_ICON from "@material-symbols/svg-700/outlined/apps.svg";
import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIconButton from "@ewsgit/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, For, Show } from "solid-js";
import trpc from "../../../../../../lib/trpc";
import styles from "./NavigationRailApplications.module.scss";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";

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
            <For each={applications()}>
              {(app) => {
                return (
                  <UKCard
                    class={styles.application}
                    onClick={() => {
                      if (app.location.type === "local") {
                        navigate(app.location.value);
                        props.toggle("applications");
                      } else if (app.location.type === "remote") {
                        window.location.href = app.location.value;
                      }
                    }}
                  >
                    <Show when={app.icon.type === "icon"}>
                      <UKIcon>{app.icon.value}</UKIcon>
                    </Show>
                    <Show when={app.icon.type === "image"}>
                      <img class={styles.applicationImageIcon} alt="" src={app.icon.value} />
                    </Show>
                    <UKText role={"label"} size="m">
                      {app.label}
                    </UKText>
                  </UKCard>
                );
              }}
            </For>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationRailApplications;
