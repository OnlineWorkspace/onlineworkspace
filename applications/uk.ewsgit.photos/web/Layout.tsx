import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import DELETE_ICON from "@material-symbols/svg-700/outlined/delete.svg";
import FACE_ICON from "@material-symbols/svg-700/outlined/face.svg";
import GROUP_ICON from "@material-symbols/svg-700/outlined/group.svg";
import GROUP_FILL_ICON from "@material-symbols/svg-700/outlined/group-fill.svg";
import IMAGE_ICON from "@material-symbols/svg-700/outlined/image.svg";
import IMAGE_FILL_ICON from "@material-symbols/svg-700/outlined/image-fill.svg";
import KID_STAR_ICON from "@material-symbols/svg-700/outlined/kid_star.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import STACKS_ICON from "@material-symbols/svg-700/outlined/stacks.svg";
import STACKS_FILL_ICON from "@material-symbols/svg-700/outlined/stacks-fill.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKFloatingActionButton from "@ewsgit/uikit-solid/src/components/floatingActionButton/UKFloatingActionButton.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKNavigationBar from "@ewsgit/uikit-solid/src/components/navigationBar/UKNavigationBar.tsx";
import UKNavigationRail from "@ewsgit/uikit-solid/src/components/navigationRail/UKNavigationRail.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";
import { useLocation, useNavigate } from "@solidjs/router";
import { type Component, createSignal, onCleanup, onMount, type ParentProps, Show, Suspense } from "solid-js";
import Viewer from "./components/Viewer";
import { usePhotos } from "./lib/context";
import PhotosProvider from "./lib/PhotosProvider";
import { routes, samePath } from "./lib/routes";
import { useViewer } from "./lib/viewer";
import styles from "./Layout.module.scss";

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

const Chrome: Component<ParentProps> = (props) => {
  const photos = usePhotos();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const viewer = useViewer();

  const [expanded, setExpanded] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  const is = (target: string) => samePath(location.pathname, target);
  const under = (target: string) => is(target) || location.pathname.startsWith(`${target.replace(/\/+$/, "")}/`);

  // the places reached from the albums page keep the "Albums" tab lit; on desktop Faces has a rail item of its own
  const inAlbums = () => under(routes.albums()) || is(routes.favorites()) || is(routes.archive());
  const inPhotos = () => is(routes.photos()) || under(routes.memories());

  const page = () => (
    <Suspense
      fallback={
        <div class={styles.spinner}>
          <UKCircularProgressIndicator />
        </div>
      }
    >
      {props.children}
    </Suspense>
  );

  // dropping files anywhere on the app uploads them
  onMount(() => {
    let depth = 0;

    const onEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth += 1;
      setDragging(true);
    };
    const onOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;

      event.preventDefault();
      depth = 0;
      setDragging(false);

      if (event.dataTransfer?.files.length) void photos.actions.uploadFiles([...event.dataTransfer.files]);
    };

    document.addEventListener("dragenter", onEnter);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);

    onCleanup(() => {
      document.removeEventListener("dragenter", onEnter);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
    });
  });

  return (
    <>
      <Show
        when={isMobile()}
        fallback={
          <UKNavigationRail
            expanded={expanded()}
            setExpanded={setExpanded}
            anchorPoints={{
              top: (
                <UKFloatingActionButton
                  class={styles.newButton}
                  icon={ADD_ICON}
                  alt="New"
                  color="tonal-primary"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    photos.actions.openNewMenu(rect.right + 8, rect.top);
                  }}
                />
              ),
            }}
            items={[
              { icon: { type: "icon", value: IMAGE_ICON }, label: "Photos", active: is(routes.photos()), onClick: () => navigate(routes.photos()) },
              { icon: { type: "icon", value: STACKS_ICON }, label: "Albums", active: inAlbums(), onClick: () => navigate(routes.albums()) },
              { icon: { type: "icon", value: KID_STAR_ICON }, label: "Memories", active: under(routes.memories()), onClick: () => navigate(routes.memories()) },
              { icon: { type: "icon", value: FACE_ICON }, label: "Faces", active: under(routes.faces()), onClick: () => navigate(routes.faces()) },
              { icon: { type: "icon", value: GROUP_ICON }, label: "Sharing", active: is(routes.sharing()), onClick: () => navigate(routes.sharing()) },
              { icon: { type: "icon", value: DELETE_ICON }, label: "Trash", active: is(routes.trash()), onClick: () => navigate(routes.trash()) },
            ]}
          >
            {page()}
          </UKNavigationRail>
        }
      >
        <div class={styles.mobile}>
          <div class={styles.mobilePage}>{page()}</div>
          <UKNavigationBar
            items={[
              { icon: IMAGE_ICON, activeIcon: IMAGE_FILL_ICON, label: "Photos", active: inPhotos(), onClick: () => navigate(routes.photos()) },
              { icon: SEARCH_ICON, label: "Search", active: is(routes.search()), onClick: () => navigate(routes.search()) },
              { icon: STACKS_ICON, activeIcon: STACKS_FILL_ICON, label: "Albums", active: inAlbums() || under(routes.faces()) || is(routes.trash()), onClick: () => navigate(routes.albums()) },
              { icon: GROUP_ICON, activeIcon: GROUP_FILL_ICON, label: "Sharing", active: is(routes.sharing()), onClick: () => navigate(routes.sharing()) },
            ]}
          />
        </div>
      </Show>

      <Show when={viewer.id() !== undefined}>
        <Viewer id={viewer.id()!} items={photos.viewerItems()} onShow={viewer.show} onClose={viewer.close} onOpenAlbum={(albumId) => navigate(routes.album(albumId))} />
      </Show>

      <Show when={dragging()}>
        <div class={styles.drop} aria-hidden="true">
          <UKIcon class={styles.dropIcon}>{UPLOAD_ICON}</UKIcon>
          <UKText role="title" size="l">
            Drop to upload
          </UKText>
        </div>
      </Show>
    </>
  );
};

const PhotosLayout: Component<ParentProps> = (props) => (
  <PhotosProvider>
    <Chrome>{props.children}</Chrome>
  </PhotosProvider>
);

export default PhotosLayout;
