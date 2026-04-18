import HOUSE_ICON from "@material-symbols/svg-700/outlined/house.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import UKSideBar from "@onlineworkspace/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import type { Component } from "solid-js";
import ActionBar from "./components/ActionBar/ActionBar";
import Quota from "./components/Quota/Quota.tsx";
import StatusBar from "./components/StatusBar/StatusBar.tsx";
import styles from "./Layout.module.scss";

const Layout: Component = () => {
  return (
    <div class={styles.root}>
      <UKSideBar
        containerClassName={styles.sidebar}
        items={[
          {
            type: "label",
            label: "Files",
          },
          {
            type: "button",
            icon: { type: "icon", value: HOUSE_ICON },
            label: "Home",
            onClick() {
              console.log("Navigate Home");
            },
          },
          {
            type: "button",
            icon: { type: "icon", value: PERSON_ICON },
            label: "Shared With Me",
            onClick() {},
          },
          {
            type: "divider",
          },
          {
            type: "label",
            label: "Pinned",
          },
          ...[],
          {
            type: "label",
            label: "Quota",
          },
          {
            type: "component",
            component: Quota,
          },
        ]}
      ></UKSideBar>
      <div class={styles.actionbar}>
        <ActionBar />
      </div>
      <div>View</div>
      <div>Preview</div>
      <div class={styles.statusbar}>
        <StatusBar />
      </div>
    </div>
  );
};

export default Layout;
