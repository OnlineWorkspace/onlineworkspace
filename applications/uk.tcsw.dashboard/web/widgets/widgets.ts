import { lazy } from "solid-js";

const Widgets = {
    "user.profile": lazy(() => import("./user/profile/Widget")),
    notifications: lazy(() => import("./notifications/Widget")),
    weather: lazy(() => import("./weather/Widget")),
};

export default Widgets;
