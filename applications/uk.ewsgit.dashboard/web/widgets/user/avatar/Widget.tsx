import UKAvatar from "@ewsgit/uikit-solid/src/components/avatar/UKAvatar.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import { type Component, createMemo, createResource } from "solid-js";
import trpc from "../../../lib/trpc";
import type { WidgetSize } from "../../widgets";
import styles from "./Widget.module.scss";

/** the avatar resolutions the server has, in pixels */
const AVATAR_RESOLUTIONS = [
  { name: "xs", px: 16 },
  { name: "s", px: 32 },
  { name: "m", px: 64 },
  { name: "l", px: 128 },
  { name: "xl", px: 256 },
  { name: "2xl", px: 512 },
] as const;

/** how large the avatar is displayed, in rem; a card is `rows * 7rem + gaps` tall and has 1rem of padding on every side */
const avatarRem = (size: WidgetSize) => (size.rows === 1 ? 5 : 12.5);

/** the smallest resolution that still has at least one image pixel per screen pixel at the displayed size */
function resolutionFor(rem: number): (typeof AVATAR_RESOLUTIONS)[number]["name"] {
  const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const screenPx = rem * remPx * window.devicePixelRatio;

  return (AVATAR_RESOLUTIONS.find((r) => r.px >= screenPx) ?? AVATAR_RESOLUTIONS.at(-1)!).name;
}

/**
 * Shows the user's avatar at 1x1 or 1x2.
 */
const Widget: Component<{ size?: WidgetSize }> = (props) => {
  const size = () => props.size ?? { cols: 1, rows: 2 };
  const rem = () => avatarRem(size());
  const resolution = createMemo(() => resolutionFor(rem()));

  const [avatar] = createResource(resolution, (name) => trpc.dashboard.widgets.user.avatar.query(name));
  const [userData] = createResource(() => trpc.dashboard.widgets.user.profile.query());

  return (
    <UKCard class={styles.card}>
      <div class={styles.avatarSize} style={{ "--avatar-size": `${rem()}rem` }}>
        <UKAvatar
          class={styles.avatar}
          avatar={avatar() || "/assets/placeholder/avatar.png"}
          size="2xl"
          username={userData()?.username || "username"}
        />
      </div>
    </UKCard>
  );
};

export default Widget;
