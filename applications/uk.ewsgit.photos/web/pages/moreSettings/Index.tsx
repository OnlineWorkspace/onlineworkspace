import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import styles from "./Index.module.scss";

const MoreSettingsPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar type="small" headline="More" />
      <div class={styles.page}>
        <UKStack>
          <UKStackItem labelText="Media Grid" onClick={() => navigate("/app/uk.ewsgit.photos/media-grid")} />
          <UKStackItem labelText="Media Viewer" onClick={() => navigate("/app/uk.ewsgit.photos/media-viewer")} />
          <UKStackItem labelText="Facial Recognition" onClick={() => navigate("/app/uk.ewsgit.photos/facial-recognition")} />
          <UKStackItem labelText="Object Recognition" onClick={() => navigate("/app/uk.ewsgit.photos/object-recognition")} />
        </UKStack>
      </div>
    </>
  );
};

export default MoreSettingsPage;
