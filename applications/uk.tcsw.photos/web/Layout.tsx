import MENU_ICON from "@material-symbols/svg-700/outlined/menu.svg";
import PHOTO_ICON from "@material-symbols/svg-700/outlined/photo.svg";
import SEARCH_ICON from "@material-symbols/svg-700/outlined/search.svg";
import { useLocation, useNavigate } from "@solidjs/router";
import UKSideBar from "@tcsw/uikit-solid/src/components/sideBar/UKSideBar.jsx";
import useIsMobile from "@tcsw/uikit-solid/src/core/useIsMobile.js";
import type { Component, ParentProps } from "solid-js";

const PhotosLayout: Component<ParentProps> = (props) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {isMobile() ? (
        <>MOBILE IS NOT YET SUPPORTED</>
      ) : (
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
              active: location.pathname === "/app/uk.tcsw.photos",
              onClick() {
                navigate("/app/uk.tcsw.photos");
              },
            },
            {
              type: "button",
              label: "Search",
              icon: { type: "icon", value: SEARCH_ICON },
              active: location.pathname === "/app/uk.tcsw.photos/search",
              onClick() {
                navigate("/app/uk.tcsw.photos/search");
              },
            },
            {
              type: "button",
              label: "More",
              icon: { type: "icon", value: MENU_ICON },
              active: location.pathname === "/app/uk.tcsw.photos/more",
              onClick() {
                navigate("/app/uk.tcsw.photos/more");
              },
            },
          ]}
        >
          {props.children}
        </UKSideBar>
      )}
    </>
  );
};

export default PhotosLayout;
