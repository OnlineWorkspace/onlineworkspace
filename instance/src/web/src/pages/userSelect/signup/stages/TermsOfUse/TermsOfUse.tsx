import UKButton, { type AffirmativeButtonState } from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKCard from "@onlineworkspace/uikit-solid/src/components/card/UKCard.jsx";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate } from "@solidjs/router";
import clsx from "clsx";
import { type Component, createResource } from "solid-js";
import trpc from "../../../../../lib/trpc";
import type { UserSelectStage } from "../../Signup";
import modalStyles from "../../Signup.module.scss";
import styles from "./TermsOfUse.module.scss";

const TermsOfUse: Component<{
  setStage(stage: UserSelectStage): void;
  signup(): Promise<{ state: AffirmativeButtonState; cb?: () => void }>;
}> = (props) => {
  const navigate = useNavigate();

  const [termsOfUse] = createResource(() => trpc.termsOfUse.query());

  return (
    <UKCard color={"filled"} class={clsx(modalStyles.modal, styles.modal)}>
      <UKText role={"title"} size={"l"} emphasized={true}>
        Terms Of Use
      </UKText>
      <UKDivider direction={"horizontal"} />
      <UKText retainTextFormatting role={"body"} size={"m"}>
        {termsOfUse()}
      </UKText>
      <UKDivider direction={"horizontal"} />
      <UKText role={"title"} size={"m"} align={"center"}>
        You must agree to the terms above to continue
      </UKText>
      <div class={styles.continueSegment}>
        <UKButton onClick={() => navigate("/")} color={"tonal"}>
          Deny
        </UKButton>
        <UKButton affirmative={true} onClick={props.signup} color={"filled"}>
          Agree and Continue
        </UKButton>
      </div>
    </UKCard>
  );
};

export default TermsOfUse;
