import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKButton, { AffirmativeButtonState } from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.jsx";
import { useNavigate, useSearchParams } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./ForgotPassword.module.scss";

const ForgotPassword: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <div class={styles.root}>
      <UKCard>TODO: Forgot password page</UKCard>
      <div class={styles.actions}>
        <UKButton
          onClick={() => {
            navigate(`/?username=${searchParams.username?.toString() || ""}`);
          }}
          color="tonal"
          leadingIcon={CHEVRON_LEFT_ICON}
        >
          Go back
        </UKButton>
        <UKButton
          affirmative
          onClick={async () => {
            return { state: AffirmativeButtonState.Error };
          }}
        >
          Continue
        </UKButton>
      </div>
    </div>
  );
};

export default ForgotPassword;
