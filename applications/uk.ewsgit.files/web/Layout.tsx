import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import DESCRIPTION_ICON from "@material-symbols/svg-700/outlined/description.svg";
import DOWNLOAD_ICON from "@material-symbols/svg-700/outlined/download.svg";
import FOLDER_ICON from "@material-symbols/svg-700/outlined/folder.svg";
import FOLDER_FILL_ICON from "@material-symbols/svg-700/outlined/folder-fill.svg";
import HOME_ICON from "@material-symbols/svg-700/outlined/home.svg";
import HOME_FILL_ICON from "@material-symbols/svg-700/outlined/home-fill.svg";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import MUSIC_NOTE_ICON from "@material-symbols/svg-700/outlined/music_note.svg";
import SCHEDULE_ICON from "@material-symbols/svg-700/outlined/schedule.svg";
import SCHEDULE_FILL_ICON from "@material-symbols/svg-700/outlined/schedule-fill.svg";
import STAR_ICON from "@material-symbols/svg-700/outlined/star.svg";
import STAR_FILL_ICON from "@material-symbols/svg-700/outlined/star-fill.svg";
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKNavigationBar from "@ewsgit/uikit-solid/src/components/navigationBar/UKNavigationBar.tsx";
import UKSideBar from "@ewsgit/uikit-solid/src/components/sideBar/UKSideBar.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { MetaProvider, Title } from "@solidjs/meta";
import { useLocation, useNavigate } from "@solidjs/router";
import { type Component, type ParentProps, Show, Suspense } from "solid-js";
import StorageMeter from "./components/StorageMeter";
import { useFiles } from "./lib/context";
import FilesProvider from "./lib/FilesProvider";
import { routes } from "./lib/routes";
import styles from "./Layout.module.scss";

const PLACE_ICONS: Record<string, string> = {
  home: HOME_ICON,
  description: DESCRIPTION_ICON,
  download: DOWNLOAD_ICON,
  image: IMAGE_ICON,
  music_note: MUSIC_NOTE_ICON,
};

const decoded = (pathname: string) => {
  try {
    return decodeURIComponent(pathname).replace(/\/+$/, "") || "/";
  } catch {
    return pathname;
  }
};

const Chrome: Component<ParentProps> = (props) => {
  const files = useFiles();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const pathname = () => decoded(location.pathname);
  const is = (target: string) => pathname() === decoded(target);
  const browsing = (virtualPath: string) => is(routes.browse(virtualPath));
  const inBrowse = () => pathname() === decoded(routes.browse("/")) || pathname().startsWith(`${decoded(routes.browse("/"))}/`);

  const page = () => <Suspense fallback={<UKCircularProgressIndicator class={styles.spinner} />}>{props.children}</Suspense>;

  const desktopHeader = () => (
    <div class={styles.brand}>
      <div class={styles.brandIcon}>
        <UKIcon>{FOLDER_ICON}</UKIcon>
      </div>
      <UKText role="title" size="l">
        Files
      </UKText>
    </div>
  );

  const newButton = () => (
    <UKButton
      color="tonal"
      size="m"
      leadingIcon={ADD_ICON}
      class={styles.newButton}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        files.actions.openNewMenu(rect.left, rect.bottom + 4);
      }}
    >
      New
    </UKButton>
  );

  return (
    <>
      <MetaProvider>
        <Title>Files</Title>
      </MetaProvider>

      <Show
        when={isMobile()}
        fallback={
          <UKSideBar
            items={[
              { type: "component", component: desktopHeader },
              { type: "component", component: newButton },
              { type: "margin" },
              { type: "button", icon: { type: "icon", value: is(routes.recent()) ? SCHEDULE_FILL_ICON : SCHEDULE_ICON }, label: "Recent", onClick: () => navigate(routes.recent()), active: is(routes.recent()) },
              { type: "button", icon: { type: "icon", value: is(routes.starred()) ? STAR_FILL_ICON : STAR_ICON }, label: "Starred", onClick: () => navigate(routes.starred()), active: is(routes.starred()) },
              { type: "divider" },
              { type: "label", label: "PLACES" },
              ...(files.places.latest ?? []).map((place) => ({
                type: "button" as const,
                icon: { type: "icon" as const, value: PLACE_ICONS[place.icon] ?? FOLDER_ICON },
                label: place.label,
                onClick: () => navigate(routes.browse(place.path)),
                active: browsing(place.path),
              })),
              { type: "divider" },
              { type: "button", icon: { type: "icon", value: DELETE_ICON }, label: "Trash", onClick: () => navigate(routes.trash()), active: is(routes.trash()) },
              { type: "component", component: () => <StorageMeter compact class={styles.storage} /> },
            ]}
          >
            {page()}
          </UKSideBar>
        }
      >
        <div class={styles.mobile}>
          <div class={styles.mobilePage}>{page()}</div>
          <UKNavigationBar
            items={[
              { icon: HOME_ICON, activeIcon: HOME_FILL_ICON, label: "Home", active: is(routes.home()), onClick: () => navigate(routes.home()) },
              { icon: FOLDER_ICON, activeIcon: FOLDER_FILL_ICON, label: "Browse", active: inBrowse(), onClick: () => navigate(routes.browse("/")) },
              { icon: SCHEDULE_ICON, activeIcon: SCHEDULE_FILL_ICON, label: "Recent", active: is(routes.recent()), onClick: () => navigate(routes.recent()) },
              { icon: STAR_ICON, activeIcon: STAR_FILL_ICON, label: "Starred", active: is(routes.starred()), onClick: () => navigate(routes.starred()) },
            ]}
          />
        </div>
      </Show>
    </>
  );
};

const Layout: Component<ParentProps> = (props) => (
  <FilesProvider>
    <Chrome>{props.children}</Chrome>
  </FilesProvider>
);

export default Layout;
