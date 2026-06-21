import { DividerDirection } from "@ewsgit/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
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
