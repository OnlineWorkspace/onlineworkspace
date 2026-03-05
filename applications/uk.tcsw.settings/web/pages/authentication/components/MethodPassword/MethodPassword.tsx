import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import {
  type Component,
  createResource,
  createSignal,
  Suspense,
} from "solid-js";
import trpc from "../../../../lib/trpc";
import styles from "./MethodPassword.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.jsx";
import UKDialog from "@tcsw/uikit-solid/src/components/dialog/UKDialog.tsx";
import ResetPasswordDialogue from "./components/ResetPasswordDialogue/ResetPasswordDialogue.tsx";

const MethodPassword: Component = () => {
  const [hasPassword, { refetch: refetchHasPassword }] = createResource(() =>
    trpc.authentication.hasPassword.query(),
  );
  const [showDialog, setShowDialog] = createSignal<boolean>(false);

  return (
    <>
      <UKStackItem
        leading={{
          type: "icon",
          value: "password",
          alt: "Password",
        }}
        labelText="Login with Password"
        supportingText={
          hasPassword()
            ? "You have password authentication enabled"
            : "Setup password authentication"
        }
        inlineComponent={
          hasPassword() && <UKIcon class={styles.enabledIcon}>check</UKIcon>
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
