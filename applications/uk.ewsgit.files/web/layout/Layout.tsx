import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import HOUSE_ICON from "@material-symbols/svg-700/outlined/house.svg";
import PERSON_ICON from "@material-symbols/svg-700/outlined/person.svg";
import UKSideBar from "@onlineworkspace/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import {useNavigate} from "@solidjs/router";
import browserPath from "path-browserify";
import {type Component, type ParentProps, useContext} from "solid-js";
import {AppContext} from "../appContext.ts";
import PreviewPane from "./components/PreviewPane/PreviewPane.tsx";
import Quota from "./components/Quota/Quota.tsx";
import StatusBar from "./components/StatusBar/StatusBar.tsx";
import styles from "./Layout.module.scss";

const Layout: Component<ParentProps> = (props) => {
  const navigate = useNavigate();
  const appContext = useContext(AppContext);

  return (
    <UKSideBar
      className={styles.sidebar}
      darwinAdditionalTopMargin={localStorage.getItem("onlineworkspace_workspace_desktop_platform") === "darwin"}
      items={[
        {
          type: "label",
          label: "Files",
        },
        {
          type: "button",
          icon: {type: "icon", value: HOUSE_ICON},
          label: "Home",
          onClick() {
            navigate(`/app/uk.ewsgit.files/dir?path=${appContext?.userPreferences.homePath}`);
          },
        },
        {
          type: "button",
          icon: {type: "icon", value: PERSON_ICON},
          label: "Shared With Me",
          onClick() {
            navigate("/app/uk.ewsgit.files/shared");
          },
        },
        {
          type: "divider",
        },
        {
          type: "label",
          label: "Pinned",
        },
        ...((appContext?.userPreferences.pinnedDirectories || []).map((dir) => {
          return {
            type: "button",
            icon: {type: "icon", value: FOLDER_ICON},
            label: browserPath.basename(dir),
            onClick() {
              let transformedPath = dir

              if (dir.startsWith("~"))
                transformedPath = dir.replace("~", appContext?.userPreferences.homePath || "~")

              navigate(`/app/uk.ewsgit.files/dir?path=${transformedPath}`);
            },
          };
        }) as {
          type: "button";
          icon: {type: "icon"; value: string};
          label: string;
          onClick(): void;
        }[]),
        ...(appContext?.isDesktopApp ? [
          {type: "divider"},
          {type: "label", label: "Local"},
          {
            type: "button",
            icon: {type: "icon", value: FOLDER_ICON},
            label: "Local Root",
            onClick() {
              navigate(`/app/uk.ewsgit.files/dir?path=local:/`);
            },
          },
        ] : []) as {
          type: "button";
          icon: {type: "icon"; value: string};
          label: string;
          onClick(): void;
        }[],
        {type: "margin"},
        {
          type: "button",
          icon: {type: "icon", value: DELETE_ICON},
          label: "Bin",
          badgeLabel: appContext?.deletedItemCount || undefined,
          onClick() {
            navigate("/app/uk.ewsgit.files/bin");
          },
        },
        {
          type: "divider",
        },
        {
          type: "label",
          label: "Quota",
        },
        {
          type: "component",
          component: Quota,
        },
      ]}
    >
      <div class={styles.root}>
        {props.children}
        <PreviewPane />
        <div class={styles.statusbar}>
          <StatusBar />
        </div>
      </div>
    </UKSideBar>
  );
};

export default Layout;
