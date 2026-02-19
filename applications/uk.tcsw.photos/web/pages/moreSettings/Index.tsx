import { useNavigate } from "@solidjs/router";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.jsx";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";

const MoreSettingsPage: Component = () => {
    const navigate = useNavigate();

    return (
        <>
            <UKTopAppBar type="small" headline="More" />
            <UKStack>
                <UKStackItem labelText="Media Grid" onClick={() => navigate("/app/uk.tcsw.photos")} />
                <UKStackItem labelText="Media Viewer" onClick={() => navigate("/app/uk.tcsw.photos")} />
                <UKStackItem labelText="Facial Recognition" onClick={() => navigate("/app/uk.tcsw.photos")} />
                <UKStackItem labelText="Object Recognition" onClick={() => navigate("/app/uk.tcsw.photos")} />
            </UKStack>
        </>
    );
};

export default MoreSettingsPage;
