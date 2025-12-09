import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import { createResource, Suspense, type Component, type ParentProps } from "solid-js";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";

const Layout: Component<ParentProps> = (props) => {
    const [isAdministrator] = createResource(() => trpc.instance.isUserAdministrator.query());
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <UKNavigationRail
            expanded={true}
            items={[
                {
                    icon: { type: "icon", value: "home" },
                    label: "Overview",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings",
                },
                {
                    icon: { type: "icon", value: "person" },
                    label: "Profile",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/profile");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/profile"),
                },
                {
                    icon: { type: "icon", value: "passkey" },
                    label: "Authentication",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/authentication");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/authentication"),
                },
                {
                    icon: { type: "icon", value: "storage" },
                    label: "Storage",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/storage");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/storage"),
                },
                {
                    icon: { type: "icon", value: "wallpaper" },
                    label: "Customization",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/customization"),
                },
                isAdministrator()
                    ? {
                          icon: { type: "icon", value: "settings_applications" },
                          label: "Configure Instance",
                          onClick() {
                              navigate("/app/uk.tcsw.settings/instance");
                          },
                          active: location.pathname.startsWith("/app/uk.tcsw.settings/instance"),
                      }
                    : undefined,
            ]}
        >
            <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>{props.children}</Suspense>
        </UKNavigationRail>
    );
};

export default Layout;
