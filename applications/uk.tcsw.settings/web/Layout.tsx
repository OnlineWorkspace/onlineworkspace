import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import { Suspense, type Component, type ParentProps } from "solid-js";
import styles from "./Layout.module.scss";

const Layout: Component<ParentProps> = (props) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <UKNavigationRail
            expanded={true}
            items={[
                {
                    icon: "home",
                    label: "Overview",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings",
                },
                {
                    icon: "person",
                    label: "Profile",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/profile");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings/profile",
                },
                {
                    icon: "passkey",
                    label: "Authentication",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/authentication");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings/authentication",
                },
                {
                    icon: "storage",
                    label: "Storage",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/storage");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings/storage",
                },
                {
                    icon: "wallpaper",
                    label: "Customization",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings/customization",
                },
                {
                    icon: "settings_applications",
                    label: "Configure Instance",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/instance");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings/instance",
                },
            ]}
        >
            <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>{props.children}</Suspense>
        </UKNavigationRail>
    );
};

export default Layout;
