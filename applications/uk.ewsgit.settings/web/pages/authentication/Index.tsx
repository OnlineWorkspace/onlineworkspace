import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.jsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
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
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.root}>
        <UKStackLabel>Login methods</UKStackLabel>
        <UKStack>
          <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner} />}>
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
