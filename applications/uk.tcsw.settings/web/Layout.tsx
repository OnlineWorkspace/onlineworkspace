import { useLocation, useNavigate } from "@solidjs/router";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.jsx";
import { createResource, Suspense, type Component, type ParentProps } from "solid-js";
import styles from "./Layout.module.scss";
import trpc from "./lib/trpc";
import UKSideBar from "@tcsw/uikit-solid/src/components/sideBar/UKSideBar.tsx";

const Layout: Component<ParentProps> = (props) => {
    const [isAdministrator] = createResource(() => trpc.instance.isUserAdministrator.query());
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <UKSideBar
            items={[
                {
                    type: "label",
                    label: "Settings",
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "home" },
                    label: "Overview",
                    onClick() {
                        navigate("/app/uk.tcsw.settings");
                    },
                    active: location.pathname === "/app/uk.tcsw.settings",
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "person" },
                    label: "Profile",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/profile");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/profile"),
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "passkey" },
                    label: "Authentication",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/authentication");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/authentication"),
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "storage" },
                    label: "Storage",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/storage");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/storage"),
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "wallpaper" },
                    label: "Customization",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/customization");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/customization"),
                },
                {
                    type: "button",
                    icon: { type: "icon", value: "apps" },
                    label: "Applications",
                    onClick() {
                        navigate("/app/uk.tcsw.settings/applications");
                    },
                    active: location.pathname.startsWith("/app/uk.tcsw.settings/applications"),
                },
                isAdministrator()
                    ? {
                          type: "button",
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
        </UKSideBar>
    );
};

export default Layout;
