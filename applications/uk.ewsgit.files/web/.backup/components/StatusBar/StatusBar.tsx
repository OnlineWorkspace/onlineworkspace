import UKText from "@onlineworkspace/uikit-solid/src/components/text/UKText.tsx";
import { type Component, useContext } from "solid-js";
import { ViewContext } from "../ViewContainer/ViewContext.ts";
import styles from "./StatusBar.module.scss";

const StatusBar: Component = () => {
  const viewCtx = useContext(ViewContext);

  return (
    <div class={styles.root}>
      {viewCtx!.activeTasks()?.[0] ? (
        <>
          <UKText role={"label"} size={"m"}>
            {viewCtx!.activeTasks()?.[0].message}
          </UKText>
        </>
      ) : (
        <UKText role={"label"} size={"m"}>
          You currently have no active tasks...
        </UKText>
      )}
    </div>
  );
};

export default StatusBar;
