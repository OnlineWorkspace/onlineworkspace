import { type Component, Suspense } from "solid-js";
import styles from "./Index.module.scss";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import MethodPassword from "./components/MethodPassword/MethodPassword";
import MethodTwoFactor from "./components/MethodTwoFactor/MethodTwoFactor";
import MethodPasskey from "./components/MethodPasskey/MethodPasskey";
import Sessions from "./components/Sessions/Sessions";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";

const AuthenticationPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Authentication"}
        leadingButton={{
          icon: "chevron_left",
          onClick() {
            navigate("/app/uk.tcsw.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.root}>
        <UKStackLabel>Login methods</UKStackLabel>
        <UKStack>
          <Suspense
            fallback={<UKIndeterminateSpinner class={styles.spinner} />}
          >
            <MethodPassword />
            <MethodTwoFactor />
            <MethodPasskey />
          </Suspense>
        </UKStack>
        <UKStackLabel>Logged in devices</UKStackLabel>
        <UKStack>
          <Suspense
            fallback={<UKIndeterminateSpinner class={styles.spinner} />}
          >
            <Sessions />
          </Suspense>
        </UKStack>
      </div>
    </>
  );
};

export default AuthenticationPage;
