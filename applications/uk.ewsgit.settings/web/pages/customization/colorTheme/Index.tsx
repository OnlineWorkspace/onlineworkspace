import { themeFromImage } from "@material/material-color-utilities";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import UKTopAppBar from "@onlineworkspace/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import { useNavigate } from "@solidjs/router";
import { type Component, createEffect, createResource } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import TriColorPreview from "./components/TriColorPreview/TriColorPreview.tsx";

const ColorThemePage: Component = () => {
  const navigate = useNavigate();
  const [wallpaperSrc] = createResource(() => trpc.customization.wallpaper.currentWallpaper.query());

  createEffect(async () => {
    if (wallpaperSrc() === undefined) return;

    const sourceImage = new Image();
    sourceImage.crossOrigin = "https://localhost";
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
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings/customization");
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
