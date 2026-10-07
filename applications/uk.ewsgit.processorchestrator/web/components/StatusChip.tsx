import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import CHECK_CIRCLE_ICON from "@material-symbols/svg-700/outlined/check_circle.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import PAUSE_CIRCLE_ICON from "@material-symbols/svg-700/outlined/pause_circle.svg";
import PROGRESS_ACTIVITY_ICON from "@material-symbols/svg-700/outlined/progress_activity.svg";
import type { Component } from "solid-js";
import type { ProcessDto } from "../lib/types";
import styles from "./StatusChip.module.scss";

type State = ProcessDto["status"]["state"];

const LABELS: Record<State, string> = {
  stopped: "Stopped",
  starting: "Starting",
  running: "Running",
  stopping: "Stopping",
  restarting: "Restarting",
  crashed: "Crashed",
};

const ICONS: Record<State, string> = {
  stopped: PAUSE_CIRCLE_ICON,
  starting: PROGRESS_ACTIVITY_ICON,
  running: CHECK_CIRCLE_ICON,
  stopping: PROGRESS_ACTIVITY_ICON,
  restarting: PROGRESS_ACTIVITY_ICON,
  crashed: ERROR_ICON,
};

/** the state is always shown as an icon and a label, never by colour alone */
const StatusChip: Component<{ state: State }> = (props) => (
  <span class={styles.root} data-state={props.state}>
    <UKIcon class={styles.icon} data-busy={props.state === "starting" || props.state === "stopping" || props.state === "restarting"}>
      {ICONS[props.state]}
    </UKIcon>
    <UKText role="label" size="m">
      {LABELS[props.state]}
    </UKText>
  </span>
);

export default StatusChip;
