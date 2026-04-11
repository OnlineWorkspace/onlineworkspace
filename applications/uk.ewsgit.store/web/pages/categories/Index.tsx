import { DividerDirection } from "@onlineworkspace/uikit-solid/src/components/divider/lib/direction.js";
import UKDivider from "@onlineworkspace/uikit-solid/src/components/divider/UKDivider.jsx";
import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.jsx";
import type { Component } from "solid-js";
import styles from "./Index.module.scss";

const Page: Component = () => {
  return (
    <div class={styles.page}>
      <div class={styles.topBar}>
        <UKText role={"title"} size="l">
          Categories
        </UKText>
      </div>
      <UKDivider direction={DividerDirection.horizontal} />
      <div class={styles.content}>Nothing here...</div>
    </div>
  );
};

export default Page;
