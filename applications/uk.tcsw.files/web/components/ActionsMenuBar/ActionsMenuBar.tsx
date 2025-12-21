import { type Component, createSignal, For } from "solid-js";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.tsx";
import styles from "./ActionsMenuBar.module.scss";

const ACTIONS: {
    label: string;
    items: {
        label: string;
        onClick(): void;
    }[];
}[] = [
    {
        label: "File",
        items: [],
    },
    {
        label: "Edit",
        items: [
            {
                label: "Cut",
                onClick() {
                    alert("TODO: Implement me!")
                },
            },
            {
                label: "Copy",
                onClick() {
                    alert("TODO: Implement me!")
                },
            },
            {
                label: "Paste",
                onClick() {
                    alert("TODO: Implement me!")
                },
            },
            {
                label: "Select All",
                onClick() {
                    alert("TODO: Implement me!")
                },
            },
            {
                label: "Select None",
                onClick() {
                    alert("TODO: Implement me!")
                },
            },
        ],
    },
    {
        label: "View",
        items: [],
    },
];

const ActionsMenuBar: Component = () => {
    const [selectedAction, setSelectedAction] = createSignal<string | undefined>(undefined);

    return (
        <div class={styles.root}>
            <For each={ACTIONS}>
                {(a) => {
                    return (
                        <div class={styles.actionWrapper}>
                            <div
                                class={styles.action}
                                data-selected={selectedAction() === a.label}
                                onClick={() => {
                                    setSelectedAction((cl) => (cl === a.label ? undefined : a.label));
                                }}
                            >
                                <UKText size={"m"} role={"label"}>
                                    {a.label}
                                </UKText>
                                {selectedAction() === a.label && (
                                    <div class={styles.itemContainer}>
                                        {a.items.length !== 0 ? (
                                            <For each={a.items}>
                                                {(i) => {
                                                    return (
                                                        <div class={styles.item} onClick={i.onClick}>
                                                            <UKText size={"m"} role={"body"}>
                                                                {i.label}
                                                            </UKText>
                                                        </div>
                                                    );
                                                }}
                                            </For>
                                        ) : (
                                            <UKText size={"m"} role={"body"}>
                                                No items
                                            </UKText>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }}
            </For>
        </div>
    );
};

export default ActionsMenuBar;
