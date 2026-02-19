import { useNavigate } from "@solidjs/router";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";
import styles from "./Index.module.scss"

const MoreSettingsPage: Component = () => {
    const navigate = useNavigate();

    return (
        <>
            <UKTopAppBar type="small" headline="More" />
            <div class={styles.page}>
            <UKStack>
                <UKStackItem labelText="Media Grid" onClick={() => navigate("/app/uk.tcsw.photos/media-grid")} />
                <UKStackItem labelText="Media Viewer" onClick={() => navigate("/app/uk.tcsw.photos/media-viewer")} />
                <UKStackItem
                    labelText="Facial Recognition"
                    onClick={() => navigate("/app/uk.tcsw.photos/facial-recognition")}
                />
                <UKStackItem
                    labelText="Object Recognition"
                    onClick={() => navigate("/app/uk.tcsw.photos/object-recognition")}
                />
            </UKStack>
            </div>
        </>
    );
};

export default MoreSettingsPage;
