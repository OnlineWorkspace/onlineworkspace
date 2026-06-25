import type { Component } from "solid-js";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import LoginBanner from "./components/LoginBanner/LoginBanner.tsx";
import LoginBackground from "./components/LoginBackground/LoginBackground.tsx";
import Favicon from "./components/Favicon/Favicon.tsx";
import SquareLogo from "./components/SquareLogo/SquareLogo.tsx";
import DefaultUserBackground from "./components/DefaultUserBackground/DefaultUserBackground.tsx";
import Tagline from "./components/Tagline/Tagline.tsx";
import DisplayName from "./components/DisplayName/DisplayName.tsx";
import MetaDescription from "./components/MetaDescription/MetaDescription.tsx";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import ShowSquareLogoInNavigation from "./components/ShowSquareLogoInNavigation/ShowSquareLogoInNavigation.tsx";

const ManageInstanceBrandingPage: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={"Manage Instance Branding"}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate("/app/uk.ewsgit.settings");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={baseSettingsPageStyles.baseSettingsPageContent}>
        <UKStackLabel>Branding</UKStackLabel>
        <UKStack>
          <LoginBanner />
          <LoginBackground />
          <Favicon />
          <SquareLogo />
          <ShowSquareLogoInNavigation/>
          <DefaultUserBackground />
          <Tagline />
          <DisplayName />
          <MetaDescription />
        </UKStack>
      </div>
    </>
  );
};

export default ManageInstanceBrandingPage;
