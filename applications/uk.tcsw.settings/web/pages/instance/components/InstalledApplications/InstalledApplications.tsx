import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import instanceStyles from "./../../Index.module.scss";
import type { Component } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import { useNavigate } from "@solidjs/router";

const InstalledApplications: Component = () => {
    const navigate = useNavigate();

    return (
        <>
            <UKText class={instanceStyles.subheading} role="title" size="m" align="start">
                Installed Applications
            </UKText>
            <UKButton color={"filled"} onClick={() => navigate("/app/uk.tcsw.store/manage-installed")}>
                View installed applications in the Store
            </UKButton>
        </>
    );
};

export default InstalledApplications;
