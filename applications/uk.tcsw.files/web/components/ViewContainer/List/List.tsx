import {
    type Component,
    createEffect,
    createResource,
    For,
    Match,
    onCleanup,
    onMount,
    Suspense,
    Switch,
    useContext,
} from "solid-js";
import styles from "./List.module.scss";
import { useNavigate, useParams } from "@solidjs/router";
import trpc from "../../../lib/trpc";
import UKIcon from "@tcsw/uikit-solid/src/components/icon/UKIcon.tsx";
import UKDivider from "@tcsw/uikit-solid/src/components/divider/UKDivider.tsx";
import { DividerDirection } from "@tcsw/uikit-solid/src/components/divider/lib/direction.ts";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@tcsw/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import { ViewContext } from "../ViewContext";
import ListItem from "./ListItem";
import { onViewKeyPressEvent } from "../keyboard";
import { createFileUploader } from "@solid-primitives/upload";
import path from "path-browserify";

const ListView: Component = () => {
    const params = useParams();
    const navigate = useNavigate();
    const viewCtx = useContext(ViewContext);
    const { selectFiles: selectFilesForUpload } = createFileUploader({
        multiple: true,
    });

    const [listResource, { refetch: refetchList }] = createResource(
        () => `/${decodeURI(params.currentPath || "")}`,
        async (pth) => {
            viewCtx?.setLastSelectionIndex(undefined);
            viewCtx?.setSelectedItems([]);
            const items = await trpc.getFileList.query({ path: pth, sortBy: "name" });
            if (items.type === "success") {
                viewCtx?.setViewItems(items.items.map((i) => i));
            } else {
                viewCtx?.setViewItems([]);
            }
            return items;
        },
    );

    const keydownListener = onViewKeyPressEvent(params, viewCtx);

    onMount(() => {
        window.addEventListener("keydown", keydownListener);
    });

    onCleanup(() => {
        window.removeEventListener("keydown", keydownListener);
    });

    createEffect(() => {
        viewCtx!.reload();
        refetchList();
    });

    return (
        <div class={styles.root}>
            <Suspense>
                <Switch
                    fallback={
                        <div class={styles.errorMessage}>
                            {/* @ts-ignore */}
                            <UKIcon>{listResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {listResource()?.message}
                            </UKText>
                            <UKButtonGroup size={"s"}>
                                <UKButton
                                    color={"filled"}
                                    size={"s"}
                                    leadingIcon={"upload"}
                                    onClick={() => {
                                        selectFilesForUpload(async (files) => {
                                            for (const file of files) {
                                                console.log(file.file);
                                                let uuid = (await trpc.uploadFile.mutate(file.file)).id;

                                                await trpc.setUploadMetadata.mutate({
                                                    id: uuid,
                                                    path: path.join(
                                                        `/${decodeURI(params.currentPath || "")}`,
                                                        file.name,
                                                    ),
                                                    lastModified: file.file.lastModified,
                                                });
                                            }

                                            viewCtx!.setReload();
                                        });
                                    }}
                                >
                                    Upload File
                                </UKButton>
                            </UKButtonGroup>
                        </div>
                    }
                >
                    <Match when={listResource()?.type === "success"}>
                        {/* @ts-ignore */}
                        <For each={listResource()?.items}>
                            {(i, index) => {
                                return <ListItem {...i} index={index()} refetchGrid={refetchList} />;
                            }}
                        </For>
                    </Match>
                    <Match when={listResource()?.type === "error"}>
                        <div class={styles.errorMessage}>
                            {/* @ts-ignore */}
                            <UKIcon>{listResource()?.icon}</UKIcon>
                            <UKDivider direction={DividerDirection.horizontal} />
                            <UKText role={"body"} size={"l"}>
                                {/* @ts-ignore */}
                                {listResource()?.message}
                            </UKText>
                            <UKButton
                                color={"filled"}
                                size={"m"}
                                leadingIcon={"house"}
                                onClick={async () => {
                                    navigate(`/app/uk.tcsw.files/dir${await trpc.getHome.query()}`);
                                }}
                            >
                                Go Home
                            </UKButton>
                        </div>
                    </Match>
                </Switch>
            </Suspense>
        </div>
    );
};

export default ListView;
