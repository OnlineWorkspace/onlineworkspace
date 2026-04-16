import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import PHOTO_ICON from "@material-symbols/svg-700/outlined/photo.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import UKSideBar from "@onlineworkspace/uikit-solid/src/components/sideBar/UKSideBar.jsx";
import { useLocation, useNavigate } from "@solidjs/router";
import type { Component, ParentProps } from "solid-js";

const PhotosLayout: Component<ParentProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <UKSideBar
      items={[
        {
          type: "label",
          label: "Photos",
        },
        {
          type: "button",
          label: "Gallery",
          icon: { type: "icon", value: PHOTO_ICON },
          active: location.pathname === "/app/uk.ewsgit.photos",
          onClick() {
            navigate("/app/uk.ewsgit.photos");
          },
        },
        {
          type: "button",
          label: "Search",
          icon: { type: "icon", value: SEARCH_ICON },
          active: location.pathname === "/app/uk.ewsgit.photos/search",
          onClick() {
            navigate("/app/uk.ewsgit.photos/search");
          },
        },
        {
          type: "button",
          label: "More",
          icon: { type: "icon", value: MENU_ICON },
          active: location.pathname === "/app/uk.ewsgit.photos/more",
          onClick() {
            navigate("/app/uk.ewsgit.photos/more");
          },
        },
      ]}
    >
      {props.children}
    </UKSideBar>
  );
};

export default PhotosLayout;
