import { type Component, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKTextField from "@ewsgit/uikit-solid/src/components/textField/UKTextField.tsx";
import UKButton, {
  AffirmativeButtonState,
} from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import styles from "./index.module.scss";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";

const ManageInstanceMailServerPage: Component = () => {
  const navigate = useNavigate();

  const [host, setHost] = createSignal("smtp.example.com");
  const [port, setPort] = createSignal(587);
  const [secure, setSecure] = createSignal(true);
  const [user, setUser] = createSignal("user");
  const [pass, setPass] = createSignal("password");

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Mail Server"}
        subtitle={"Caution: Advanced users only, change at your own risk."}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <UKStackLabel>Mailserver</UKStackLabel>
        <UKCard class={styles.card} color="filled">
          <div class={styles.hostContainer}>
            <UKTextField
              color="outlined"
              label="Host"
              defaultValue={host()}
              onValueChange={setHost}
            />
            <UKTextField
              color="outlined"
              label="Port"
              defaultValue={port().toString()}
              onValueChange={(v) => setPort(Number(v))}
            />
          </div>
          <UKTextField
            color="outlined"
            label="Username"
            defaultValue={user()}
            onValueChange={setUser}
          />
          <UKTextField
            color="outlined"
            label="Password"
            defaultValue={pass()}
            onValueChange={setPass}
            shouldMask={true}
          />
          <UKButton
            affirmative
            onClick={async () => {
              // promise which resolves after 2 seconds
              await new Promise((resolve) => setTimeout(resolve, 2000));
              // trpc.instance.mailserver.set()

              return { state: AffirmativeButtonState.Success };
            }}
          >
            Save
          </UKButton>
        </UKCard>
      </div>
    </>
  );
};

export default ManageInstanceMailServerPage;
