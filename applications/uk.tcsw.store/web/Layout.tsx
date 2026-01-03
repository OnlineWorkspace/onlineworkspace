import { useLocation, useNavigate } from "@solidjs/router";
import UKNavigationRail from "@tcsw/uikit-solid/src/components/navigationRail/UKNavigationRail.jsx";
import type { Component, ParentProps } from "solid-js";

const Layout: Component<ParentProps> = (props) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <UKNavigationRail
            items={[
                // {
                //     icon: { type: "icon", value: "editor_choice" },
                //     label: "Promoted",
                //     onClick() {
                //         navigate("/app/uk.tcsw.store");
                //     },
                //     active: location.pathname === "/app/uk.tcsw.store",
                // },
                {
                    icon: { type: "icon", value: "search" },
                    label: "Search",
                    onClick() {
                        navigate("/app/uk.tcsw.store/search");
                    },
                    active:
                        location.pathname === "/app/uk.tcsw.store/search" || location.pathname === "/app/uk.tcsw.store",
                },
                // {
                //     icon: {type: "icon", value: "category"},
                //     label: "Categories",
                //     onClick() {
                //         navigate("/app/uk.tcsw.store/categories")
                //     },
                //     active: location.pathname === "/app/uk.tcsw.store/categories"
                // },
                {
                    icon: { type: "icon", value: "apps" },
                    label: "Installed",
                    onClick() {
                        navigate("/app/uk.tcsw.store/manage-installed");
                    },
                    active: location.pathname === "/app/uk.tcsw.store/manage-installed",
                },
            ]}
        >
            {props.children}
        </UKNavigationRail>
    );
};

export default Layout;
