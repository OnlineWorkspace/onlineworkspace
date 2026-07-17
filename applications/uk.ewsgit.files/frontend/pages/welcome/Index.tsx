import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./Index.module.scss";

const WelcomePage: Component = () => {
  const navigate = useNavigate();

  return (
    <div class={styles.page}>
      <UKCard>
        <UKText role={"display"} size={"m"} emphasized={true}>
          Welcome To Files
        </UKText>
        <UKText role={"body"} size={"l"}>
          Let's get everything setup for you.
        </UKText>
      </UKCard>
      <UKButtonGroup size={"s"} align={"end"}>
        <UKButton
          onClick={() => {
            navigate("/app/uk.ewsgit.files/dir");
          }}
          color={"tonal"}
        >
          Skip
        </UKButton>
        <UKButton
          onClick={() => {
            navigate("/app/uk.ewsgit.files/dir");
          }}
        >
          Continue
        </UKButton>
      </UKButtonGroup>
    </div>
  );
};

export default WelcomePage;
