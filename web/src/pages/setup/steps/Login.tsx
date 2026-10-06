import PASSWORD_ICON from "@material-symbols/svg-700/outlined/password.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { type Component, For } from "solid-js";
import { StepButtons } from "../components/ChoiceStep/ChoiceStep";
import SettingRow from "../components/SettingRow/SettingRow";
import StepPage from "../components/StepPage/StepPage";
import styles from "../Setup.module.scss";
import type { StepProps } from "./types";

const METHODS = [
  { id: "password", icon: PASSWORD_ICON, title: "Username and password", description: "People type their username and password to sign in. The best choice for an instance which is open to the public." },
  { id: "profiles", icon: GROUP_ICON, title: "Profiles", description: "Everyone on the instance is listed on the login screen and picks their own profile. Only use this on instances which are not public." },
] as const;

const Login: Component<StepProps> = (props) => (
  <StepPage title={"Design your login page"} description={"Choose how people sign in to this instance and what the login screen looks like."} actions={<StepButtons {...props} />}>
    <div class={styles.loginMethods} role={"radiogroup"} aria-label={"Sign in method"}>
      <For each={METHODS}>
        {(method) => (
          <button type={"button"} role={"radio"} aria-checked={props.state.login.method === method.id} class={styles.loginMethod} data-selected={props.state.login.method === method.id} onClick={() => props.setState("login", "method", method.id)}>
            <UKIcon>{method.icon}</UKIcon>
            <UKText role={"title"} size={"l"} emphasized={true} align={"start"} class={styles.loginMethodText}>
              {method.title}
            </UKText>
            <UKText role={"body"} size={"m"} align={"start"} class={styles.loginMethodText}>
              {method.description}
            </UKText>
          </button>
        )}
      </For>
    </div>
    <div class={styles.loginOptions}>
      <SettingRow label={"Login background"} supporting={"Show the background image behind the login screen"} value={props.state.login.showBackground} onValueChange={(v) => props.setState("login", "showBackground", v)} />
      <SettingRow label={"Login banner"} supporting={"Show the banner image on the login screen"} value={props.state.login.showBanner} onValueChange={(v) => props.setState("login", "showBanner", v)} />
    </div>
  </StepPage>
);

export default Login;
