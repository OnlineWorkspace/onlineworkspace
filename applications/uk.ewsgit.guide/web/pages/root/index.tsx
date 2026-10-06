import CHECK_ICON from "@material-symbols/svg-700/outlined/check.svg";
import DASHBOARD_ICON from "@material-symbols/svg-700/outlined/dashboard.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import PHOTO_LIBRARY_ICON from "@material-symbols/svg-700/outlined/photo_library.svg";
import SETTINGS_ICON from "@material-symbols/svg-700/outlined/settings.svg";
import STOREFRONT_ICON from "@material-symbols/svg-700/outlined/storefront.svg";
import WAVING_HAND_ICON from "@material-symbols/svg-700/outlined/waving_hand.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCard from "@ewsgit/uikit-solid/src/components/card/UKCard.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createSignal, For, Show } from "solid-js";
import styles from "./index.module.scss";

const SLIDES = [
  {
    icon: WAVING_HAND_ICON,
    title: "Welcome to your workspace",
    body: "Your files, photos and apps live together in one place that you control. This quick tour covers the basics, and takes under a minute.",
  },
  {
    icon: DASHBOARD_ICON,
    title: "Dashboard",
    body: "The dashboard is your homepage. Add widgets such as the weather and your notifications, and rearrange them with the edit button.",
  },
  {
    icon: FOLDER_ICON,
    title: "Files",
    body: "Upload, organise and share files and folders. The storage meter shows how much of your quota you have used.",
  },
  {
    icon: PHOTO_LIBRARY_ICON,
    title: "Photos",
    body: "View and manage your photos and videos in a library that stays on this workspace.",
  },
  {
    icon: STOREFRONT_ICON,
    title: "Store",
    body: "Browse and install more applications to extend what your workspace can do.",
  },
  {
    icon: SETTINGS_ICON,
    title: "Settings",
    body: "Update your profile, avatar and pronouns, review storage usage, and secure your account with two factor authentication.",
  },
  {
    icon: CHECK_ICON,
    title: "You're all set",
    body: "That's everything you need to get started. You can find all of your applications from the navigation rail at any time.",
  },
];

/** a short step by step tour of the workspace, offered to new users after signup */
const RootPage: Component = () => {
  const navigate = useNavigate();
  const [index, setIndex] = createSignal(0);
  const slide = () => SLIDES[index()];
  const isLast = () => index() === SLIDES.length - 1;
  const finish = () => navigate("/app");

  return (
    <div class={styles.page}>
      <UKCard color={"filled"} class={styles.guide}>
        <div class={styles.icon}>
          <UKIcon>{slide().icon}</UKIcon>
        </div>
        <div class={styles.copy} aria-live="polite">
          <UKText role={"headline"} size={"s"} emphasized={true} align={"center"}>
            {slide().title}
          </UKText>
          <UKText role={"body"} size={"l"} align={"center"} class={styles.body}>
            {slide().body}
          </UKText>
        </div>
        <div class={styles.dots}>
          <For each={SLIDES}>{(_, i) => <span class={styles.dot} data-active={i() === index()} />}</For>
        </div>
        <div class={styles.buttons}>
          <Show
            when={index() > 0}
            fallback={
              <UKButton onClick={finish} color={"tonal"}>
                Skip
              </UKButton>
            }
          >
            <UKButton
              onClick={() => {
                setIndex(index() - 1);
              }}
              color={"tonal"}
            >
              Back
            </UKButton>
          </Show>
          <UKButton
            onClick={() => {
              if (isLast()) finish();
              else setIndex(index() + 1);
            }}
            color={"filled"}
          >
            {isLast() ? "Get started" : "Next"}
          </UKButton>
        </div>
      </UKCard>
    </div>
  );
};

export default RootPage;
