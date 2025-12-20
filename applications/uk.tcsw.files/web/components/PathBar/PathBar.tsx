import { type Component, For } from "solid-js";
import styles from "./PathBar.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import path from "path-browserify";
import { useNavigate, useParams } from "@solidjs/router";

const PathBar: Component = () => {
    const navigate = useNavigate()
    let { currentPath } = useParams<{ currentPath: string }>()

    return (
        <div class={styles.root}>
            <For each={(`/${currentPath || ""}`).split("/")}>
                {(segment, index) => {
                    if (index() === (`/${currentPath || ""}`).split("/").length - 1 && segment === "") return null;

                    return (
                        <>
                            <UKText
                                onClick={(e) => {
                                    e.stopPropagation();

                                    let split = (`/${currentPath || ""}`).split("/");
                                    let output = "/";

                                    for (let i = 0; i < index() + 1; i++) {
                                        console.log(split[i]);
                                        output = path.join(output, split[i]);
                                    }

                                    navigate(`/app/uk.tcsw.files/dir${output}`);
                                }}
                                class={styles.segment}
                                role={"label"}
                                size={"l"}
                            >
                                {segment !== "" ? <span>{segment}</span> : null}
                                {index() !== (`/${currentPath || ""}`).split("/").length - 1 && <span>/</span>}
                            </UKText>
                        </>
                    );
                }}
            </For>
        </div>
    );
};

export default PathBar;
