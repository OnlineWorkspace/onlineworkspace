import { lazy } from "solid-js";

const Widgets = {
  "user.profile": lazy(() => import("./user/profile/Widget")),
  "user.avatar": lazy(() => import("./user/avatar/Widget")),
  notifications: lazy(() => import("./notifications/Widget")),
  weather: lazy(() => import("./weather/Widget")),
  search: lazy(() => import("./search/Widget")),
};

export default Widgets;
