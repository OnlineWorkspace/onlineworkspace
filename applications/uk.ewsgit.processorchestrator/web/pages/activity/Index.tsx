import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKListItem from "@ewsgit/uikit-solid/src/components/list/UKListItem.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHECK_CIRCLE_ICON from "@material-symbols/svg-700/outlined/check_circle.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import PAUSE_CIRCLE_ICON from "@material-symbols/svg-700/outlined/pause_circle.svg";
import PLAY_CIRCLE_ICON from "@material-symbols/svg-700/outlined/play_circle.svg";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, For, Show } from "solid-js";
import { formatDuration, formatTime } from "../../lib/format";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import styles from "./Index.module.scss";

const ActivityPage: Component = () => {
  const navigate = useNavigate();
  const [runs] = createResource(() => trpc.runs.query({ limit: 100 }));

  const describe = (run: NonNullable<ReturnType<typeof runs>>[number]) => {
    if (!run.endedAt) return { icon: PLAY_CIRCLE_ICON, text: "Running" };

    const took = formatDuration(new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime());
    const how = run.signal ? `killed by ${run.signal}` : `exit code ${run.exitCode ?? 0}`;

    if (run.reason === "user-stop") return { icon: PAUSE_CIRCLE_ICON, text: `Stopped after ${took}` };
    if (run.reason === "spawn-failed") return { icon: ERROR_ICON, text: "Could not start" };
    if (run.reason === "crashed") return { icon: ERROR_ICON, text: `Crashed after ${took}, ${how}` };

    return { icon: CHECK_CIRCLE_ICON, text: `Exited after ${took}, ${how}` };
  };

  return (
    <div class={styles.page}>
      <UKTopAppBar type="large" headline="Activity" subtitle="Every time a process was started, and how it ended" />
      <div class={styles.content}>
        <Show when={runs.loading}>
          <UKCircularProgressIndicator class={styles.spinner} />
        </Show>
        <Show when={runs.latest && runs.latest.length === 0}>
          <UKText role="body" size="m" class={styles.empty}>
            Nothing has been run yet.
          </UKText>
        </Show>
        <For each={runs.latest}>
          {(run) => {
            const info = describe(run);

            return (
              <UKListItem
                labelText={run.processName}
                supportingText={`${info.text} · ${formatTime(run.startedAt)}`}
                leading={{ type: "icon", value: info.icon }}
                onClick={() => navigate(routes.detail(run.processId))}
                divider
              />
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default ActivityPage;
