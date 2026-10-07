import CODE_ICON from "@material-symbols/svg-700/outlined/code.svg";
import WARNING_ICON from "@material-symbols/svg-700/outlined/warning.svg";
import DNS_ICON from "@material-symbols/svg-700/outlined/dns.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For, Show } from "solid-js";
import { StepButtons } from "../components/ChoiceStep/ChoiceStep";
import StepPage from "../components/StepPage/StepPage";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const INSTALLS = [
  { development: false, icon: DNS_ICON, title: "Production", description: "A real instance for real users. Administrators must set up two factor authentication before they can use it." },
  { development: true, icon: CODE_ICON, title: "Development", description: "An instance for building and testing on this machine. Administrators are not made to set up two factor authentication." },
] as const;

const Environment: Component<StepProps> = (props) => (
  <StepPage title={"What kind of install is this?"} description={"Only offered because you are setting this instance up from localhost."} actions={<StepButtons {...props} />}>
    <div class={styles.loginMethods} role={"radiogroup"} aria-label={"Install type"}>
      <For each={INSTALLS}>
        {(install) => (
          <button type={"button"} role={"radio"} aria-checked={props.state.environment.development === install.development} class={styles.loginMethod} data-selected={props.state.environment.development === install.development} onClick={() => props.setState("environment", "development", install.development)}>
            <UKIcon>{install.icon}</UKIcon>
            <UKText role={"title"} size={"l"} emphasized={true} align={"start"} class={styles.loginMethodText}>
              {install.title}
            </UKText>
            <UKText role={"body"} size={"m"} align={"start"} class={styles.loginMethodText}>
              {install.description}
            </UKText>
          </button>
        )}
      </For>
    </div>
    <Show when={props.state.environment.development}>
      <div class={styles.devWarning} role={"alert"}>
        <div class={styles.devWarningHeader}>
          <span class={styles.devWarningIcon}>
            <UKIcon>{WARNING_ICON}</UKIcon>
          </span>
          <UKText role={"title"} size={"l"} emphasized={true} align={"start"}>
            Whoa there, tiny dev!
          </UKText>
        </div>
        <UKText role={"body"} size={"m"} align={"start"}>
          Your administrator account will have no two factor protection, so its password is the only thing between the internet and everything on this instance. Only use this on a machine nobody else can reach, and never for real users or real data.
        </UKText>
      </div>
    </Show>
  </StepPage>
);

export default Environment;
