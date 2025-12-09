import type { Component } from "solid-js";
import ThemePreview from "./components/ThemePreview/ThemePreview.tsx";
import UKStack from "@tcsw/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@tcsw/uikit-solid/src/components/stack/UKStackItem.tsx";
import { useNavigate } from "@solidjs/router";

const CustomizationPage: Component = () => {
    const navigate = useNavigate()

    return (
        <>
            <ThemePreview />
            <UKStack>
                <UKStackItem labelText={"Color Theme"} onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization/color-theme")
                }} />
                <UKStackItem labelText={"Wallpaper"} onClick={() => {
                    navigate("/app/uk.tcsw.settings/customization/wallpaper")
                }} />
            </UKStack>
        </>
    );
};

export default CustomizationPage;
