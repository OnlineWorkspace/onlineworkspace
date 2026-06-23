import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import type { Component } from "solid-js";
import styles from "./Branding.module.scss";
import LoginBanner from "./components/LoginBanner/LoginBanner";
import LoginBackground from "./components/LoginBackground/LoginBackground";
import Favicon from "./components/Favicon/Favicon";
import SquareLogo from "./components/SquareLogo/SquareLogo";
import DefaultUserBackground from "./components/DefaultUserBackground/DefaultUserBackground";
import Tagline from "./components/Tagline/Tagline";
import DisplayName from "./components/DisplayName/DisplayName";
import MetaDescription from "./components/MetaDescription/MetaDescription";

const Branding: Component = () => {
  return (
    <>
      <UKStackLabel>Branding</UKStackLabel>
      <UKStack>
        <LoginBanner />
        <LoginBackground />
        <Favicon />
        <SquareLogo />
        <DefaultUserBackground />
        <Tagline />
        <DisplayName />
        <MetaDescription />
      </UKStack>
    </>
  );
};

export default Branding;
