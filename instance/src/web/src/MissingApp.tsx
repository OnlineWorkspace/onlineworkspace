import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.jsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.jsx";
import { useNavigate, useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./MissingApp.module.scss";

const MissingApp: Component = () => {
  const params = useParams();
  const navigate = useNavigate();

  return (
    <div class={styles.root}>
      <UKText role="title" size="l">
        Missing Application
      </UKText>
      <UKText role="body" size="l">
        The application '{params.applicationId}' cannot be found.
      </UKText>
      <UKButton
        onClick={() => {
          navigate("/app/uk.ewsgit.dashboard");
        }}
      >
        Back to Dashboard
      </UKButton>
    </div>
  );
};

export default MissingApp;
