import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { type Component, Suspense } from "solid-js";
import MethodPasskey from "./components/MethodPasskey/MethodPasskey";
import MethodPassword from "./components/MethodPassword/MethodPassword";
import MethodTwoFactor from "./components/MethodTwoFactor/MethodTwoFactor";
import Sessions from "./components/Sessions/Sessions";
import styles from "./Index.module.scss";

const AuthenticationPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Authentication"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.root}>
        <UKStackLabel>Login methods</UKStackLabel>
        <UKStack>
          <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
            <MethodPassword />
            <MethodTwoFactor />
            <MethodPasskey />
          </Suspense>
        </UKStack>
        <UKStackLabel>Logged in devices</UKStackLabel>
            <Sessions />
      </div>
    </>
  );
};

export default AuthenticationPage;
