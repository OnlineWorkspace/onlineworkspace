import { useSearchParams } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import {
  type Component,
  createResource,
  createSignal,
  Suspense,
} from "solid-js";
import trpc from "../../../../lib/trpc";
import ResetPasswordDialogue from "./components/ResetPasswordDialogue/ResetPasswordDialogue.tsx";
import styles from "./MethodPassword.module.scss";
import CHECK_ICON from "@material-symbols/svg-500/outlined/check.svg"
import PASSWORD_ICON from "@material-symbols/svg-500/outlined/password.svg"

const MethodPassword: Component = () => {
  const [hasPassword, { refetch: refetchHasPassword }] = createResource(() =>
    trpc.authentication.hasPassword.query(),
  );
  const [urlSearchParams] = useSearchParams();
  const [showDialog, setShowDialog] = createSignal<boolean>(
    urlSearchParams["change-passsword"] === "true",
  );

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: PASSWORD_ICON,
          alt: "Password",
        }}
        labelText="Login with Password"
        supportingText={
          hasPassword()
            ? "You have password authentication enabled"
            : "Setup password authentication"
        }
        inlineComponent={
          hasPassword() && <UKIcon class={styles.enabledIcon}>{CHECK_ICON}</UKIcon>
        }
        expandedComponent={
          <div class={styles.expanded}>
            <UKText role="body" size="m">
              Use a password to login to your Workspace account.
            </UKText>
            <UKButton
              class={styles.button}
              onClick={async () => {
                setShowDialog(true);
                return 0;
              }}
            >
              <Suspense>{hasPassword() ? "Reset" : "Set"} password</Suspense>
            </UKButton>
          </div>
        }
      />
      <UKDialog
        show={showDialog}
        onClose={() => {
          setShowDialog(false);
          refetchHasPassword();
        }}
        maxWidth={"32rem"}
      >
        <ResetPasswordDialogue
          closeDialogue={() => {
            setShowDialog(false);
            refetchHasPassword();
          }}
        />
      </UKDialog>
    </>
  );
};

export default MethodPassword;
