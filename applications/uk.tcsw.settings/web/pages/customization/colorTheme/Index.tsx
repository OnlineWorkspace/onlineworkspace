import { createEffect, createResource, type Component } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.tsx";
import { useNavigate } from "@solidjs/router";
import styles from "./Index.module.scss";
import TriColorPreview from "./components/TriColorPreview/TriColorPreview.tsx";
import { themeFromImage } from "@material/material-color-utilities";
import trpc from "../../../lib/trpc.ts";
import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";

const ColorThemePage: Component = () => {
    const navigate = useNavigate();
    const [wallpaperSrc] = createResource(() =>
        trpc.customization.wallpaper.currentWallpaper.query(),
    );

    createEffect(async () => {
        if (wallpaperSrc() === undefined) return;

        let sourceImage = new Image();
        sourceImage.crossOrigin = "http://localhost:5173";
        sourceImage.src = wallpaperSrc()!;

        console.log(await themeFromImage(sourceImage));
    });

    return (
        <>
            <UKTopAppBar
                type={"small"}
                headline={"Color Theme"}
                leadingButton={{
                    accessibleLabel: "Back",
                    icon: "chevron_left",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                }}
            />
            Matched to your wallpaper
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            Static colors
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
            <TriColorPreview colors={["#fff", "#f00", "#0f0"]} />
        </>
    );
};

export default ColorThemePage;
