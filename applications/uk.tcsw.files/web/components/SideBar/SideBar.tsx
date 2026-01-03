import { createResource, For, useContext, type Component } from "solid-js";
import styles from "./SideBar.module.scss";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../lib/trpc.ts";
import path from "path-browserify";
import { ViewContext } from "../ViewContainer/ViewContext.ts";

const SideBar: Component = () => {
    const navigate = useNavigate();
    const viewCtx = useContext(ViewContext);
    let params = useParams<{ currentPath: string }>();

    const [places] = createResource(() => trpc.getPlaces.query());

    return (
        <div class={styles.root}>
            <img
                draggable={false}
                class={styles.headerImage}
                alt={""}
                src={"/assets/tricolor/tricolor_transparent_dark_background.svg"}
            />
            <UKButton
                color={"filled"}
                size={"s"}
                leadingIcon={"upload"}
                onClick={() => {
                    alert("Implement me!");
                }}
            >
                Upload File
            </UKButton>
            <UKButton
                color={"tonal"}
                size={"s"}
                leadingIcon={"add"}
                disabled={viewCtx!.viewItems().findIndex((i) => path.basename(i.path) === "untitled") !== -1}
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
                leadingIcon={"add"}
                disabled={viewCtx!.viewItems().findIndex((i) => path.basename(i.path) === "untitled") !== -1}
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
