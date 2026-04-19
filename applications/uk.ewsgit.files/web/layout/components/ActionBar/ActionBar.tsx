import ARROW_UPWARD_ICON from "@material-symbols/svg-700/outlined/arrow_upward.svg";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import CHEVRON_RIGHT_ICON from "@material-symbols/svg-700/outlined/chevron_right.svg";
import UKIconButton from "@onlineworkspace/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import { useSearchParams } from "@solidjs/router";
import browserPath from "path-browserify";
import { type Component, Show } from "solid-js";
import styles from "./ActionBar.module.scss";

const ActionBar: Component = () => {
  const [searchParams, setSearchParams] = useSearchParams<{ path: string }>();

  return (
    <div class={styles.root}>
      <div class={styles.actionButtons}>
        <UKIconButton icon={CHEVRON_LEFT_ICON} color={"standard"} alt={"go back"} onClick={() => window.history.back()} />
        <UKIconButton icon={CHEVRON_RIGHT_ICON} color={"standard"} alt={"go forwards"} onClick={() => window.history.forward()} />
        <UKIconButton
          icon={ARROW_UPWARD_ICON}
          color={"standard"}
          alt={"go up one directory"}
          onClick={() => {
            console.log("Implement this");
          }}
        />
      </div>
      <Show when={searchParams.path !== undefined}>
        <div class={styles.pathSelector}>
          <div class={styles.pathSegments}>
            {/* Path Segments */}
            {(searchParams.path || "").split(browserPath.sep).join(" / ")}
          </div>
          <input class={styles.pathInput} type={"text"} value={searchParams.path} onChange={(e) => setSearchParams({ path: e.currentTarget.value })} />
        </div>
      </Show>
    </div>
  );
};

export default ActionBar;
