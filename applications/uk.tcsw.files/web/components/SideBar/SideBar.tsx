import ADD_ICON from "@material-symbols/svg-700/outlined/add.svg";
import UPLOAD_ICON from "@material-symbols/svg-700/outlined/upload.svg";
import { createFileUploader } from "@solid-primitives/upload";
import { useNavigate, useParams } from "@solidjs/router";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import backend from "@tcsw/workspaces-instance-web/src/lib/backend";
import path from "path-browserify";
import { type Component, createResource, For, useContext } from "solid-js";
import trpc from "../../lib/trpc.ts";
import { ViewContext } from "../ViewContainer/ViewContext.ts";
import styles from "./SideBar.module.scss";

const SideBar: Component = () => {
  const navigate = useNavigate();
  const viewCtx = useContext(ViewContext);
  const params = useParams<{ currentPath: string }>();
  const { selectFiles: selectFilesForUpload } = createFileUploader({
    multiple: true,
  });

  const [places] = createResource(() => trpc.getPlaces.query());

  return (
    <div class={styles.root}>
      <img
        draggable={false}
        class={styles.headerImage}
        alt={""}
        src={backend("/api/instance/login/banner")}
      />
      <UKButton
        color={"filled"}
        size={"s"}
        leadingIcon={UPLOAD_ICON}
        onClick={() => {
          selectFilesForUpload(async (files) => {
            for (const file of files) {
              const taskUUID = crypto.randomUUID();
              viewCtx!.setActiveTasks([
                ...viewCtx!.activeTasks(),
                { taskId: taskUUID, message: `Uploading file '${file.name}'` },
              ]);
              const uuid = (await trpc.uploadFile.mutate(file.file)).id;

              await trpc.setUploadMetadata.mutate({
                id: uuid,
                path: path.join(`/${decodeURI(params.currentPath || "")}`, file.name),
                lastModified: file.file.lastModified,
              });
              viewCtx!.setActiveTasks(viewCtx!.activeTasks().filter((t) => t.taskId !== taskUUID));

              viewCtx!.setViewItems([
                ...viewCtx!.viewItems(),
                {
                  name: file.name,
                  path: path.join(`/${decodeURI(params.currentPath || "")}`, file.name),
                  type: "ghost",
                },
              ]);
            }

            viewCtx!.setReload();
          });
        }}
      >
        Upload File
      </UKButton>
      <UKButton
        color={"tonal"}
        size={"s"}
        leadingIcon={ADD_ICON}
        disabled={
          viewCtx!.viewItems().findIndex((i) => path.basename(i.path) === "untitled") !== -1
        }
        onClick={async () => {
          await trpc.createDirectory.mutate({
            directoryPath: path.join(`/${decodeURI(params.currentPath || "")}`, "untitled"),
          });
          viewCtx!.setRenameEntry(path.join(`${decodeURI(params.currentPath || "")}`, "untitled"));
          viewCtx!.setReload();
        }}
      >
        Create Directory
      </UKButton>
      <UKButton
        color={"tonal"}
        size={"s"}
        leadingIcon={ADD_ICON}
        disabled={
          viewCtx!.viewItems().findIndex((i) => path.basename(i.path) === "untitled") !== -1
        }
        onClick={async () => {
          await trpc.createFile.mutate({
            filePath: path.join(`/${decodeURI(params.currentPath || "")}`, "untitled"),
          });
          viewCtx!.setRenameEntry(path.join(`${decodeURI(params.currentPath || "")}`, "untitled"));
          viewCtx!.setReload();
        }}
      >
        Create File
      </UKButton>
      <UKDivider direction={DividerDirection.horizontal} />
      <For each={places()}>
        {(place) => {
          return (
            <UKButton
              color={"standard"}
              size={"s"}
              leadingIcon={place.icon}
              onClick={() => {
                navigate(`/app/uk.tcsw.files/dir${place.path}`);
              }}
            >
              {place.name}
            </UKButton>
          );
        }}
      </For>
    </div>
  );
};

export default SideBar;
