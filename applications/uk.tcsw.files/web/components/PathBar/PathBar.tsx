import { type Component, createSignal, For } from "solid-js";
import styles from "./PathBar.module.scss";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import path from "path-browserify";
import { useNavigate, useParams } from "@solidjs/router";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.tsx";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";

const PathBar: Component = () => {
    const navigate = useNavigate();
    let params = useParams<{ currentPath: string }>();
    const [showTextField, setShowTextField] = createSignal();

    return (
        <div class={styles.root}>
            <UKIconButton
                disabled={params.currentPath === undefined}
                onClick={() => {
                    let split = `/${params.currentPath || ""}`.split("/");
                    let output = "/";

                    for (let i = 0; i < split.length - 1; i++) {
                        console.log(split[i]);
                        output = path.join(output, split[i]);
                    }

                    navigate(`/app/uk.tcsw.files/dir${output}`);
                }}
                size={"xs"}
                color={"standard"}
                alt={"go up one directory"}
                icon={"arrow_upward"}
                width="default"
            />
            <UKIconButton
                disabled={params.currentPath === "users"}
                onClick={() => {
                    navigate(`/app/uk.tcsw.files/dir/users`);
                }}
                size={"xs"}
                color={"standard"}
                alt={"go to home"}
                icon={"house"}
                width="default"
            />
            {showTextField() ? (
                <div class={styles.textField}>
                    <UKTextField
                        label={"Path"}
                        defaultValue={`/${params.currentPath || ""}`}
                        getValue={(val) => {
                            if (val[0] === "/") navigate(`/app/uk.tcsw.files/dir${val}`);
                        }}
                        onBlur={() => setShowTextField(false)}
                        onSubmit={() => setShowTextField(false)}
                        color={"outlined"}
                    />
                </div>
            ) : (
                <>
                    <div class={styles.segmentContainer} onDblClick={() => setShowTextField(true)}>
                        <For each={`/${params.currentPath || ""}`.split("/")}>
                            {(segment, index) => {
                                if (index() === `/${params.currentPath || ""}`.split("/").length - 1 && segment === "") return null;

                                return (
                                    <>
                                        <UKText
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                let split = `/${params.currentPath || ""}`.split("/");
                                                let output = "/";

                                                for (let i = 0; i < index() + 1; i++) {
                                                    output = path.join(output, split[i]);
                                                }

                                                navigate(`/app/uk.tcsw.files/dir${output}`);
                                            }}
                                            class={styles.segment}
                                            role={"label"}
                                            size={"l"}
                                        >
                                            {segment !== "" ? <span>{segment}</span> : null}
                                            {index() !== `/${params.currentPath || ""}`.split("/").length - 1 && (
                                                <span class={styles.slash}>/</span>
                                            )}
                                        </UKText>
                                    </>
                                );
                            }}
                        </For>
                    </div>
                </>
            )}
        </div>
    );
};

export default PathBar;
