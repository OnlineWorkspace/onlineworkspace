import UKTopAppBar from "@tcsw/uikit-solid/src/components/topAppBar/UKTopAppBar.jsx";
import type { Component } from "solid-js";
import MediaGrid from "../../components/mediaGrid/MediaGrid";

const GalleryPage: Component = () => {
    return (
        <div>
            <UKTopAppBar type="small" headline="Gallery" />
            <MediaGrid
                items={[
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                    { src: "/assets/tricolor/tricolor.svg", size: { width: 100, height: 100 } },
                ]}
            />
        </div>
    );
};

export default GalleryPage;
