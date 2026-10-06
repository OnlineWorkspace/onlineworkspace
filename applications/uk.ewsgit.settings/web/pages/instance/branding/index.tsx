import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate } from "@solidjs/router";
import { type Component, createResource, type ParentProps } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import baseSettingsPageStyles from "../../../BaseSettingsPage.module.scss";
import AssetCard from "./components/AssetCard/AssetCard.tsx";
import LogoLink from "./components/LogoLink/LogoLink.tsx";
import IdentityCard from "./components/IdentityCard/IdentityCard.tsx";
import styles from "./index.module.scss";

const Section: Component<ParentProps<{ title: string }>> = (props) => (
  <section class={styles.section}>
    <UKText role="title" size="m" emphasized class={styles.sectionHeading}>
      {props.title}
    </UKText>
    {props.children}
  </section>
);

const ManageInstanceBrandingPage: Component = () => {
  const navigate = useNavigate();
  const [bannerEnabled, { mutate: setBannerEnabled }] = createResource(() => trpc.instance.branding.loginBanner.isEnabled.query(), { initialValue: true });
  const [backgroundEnabled, { mutate: setBackgroundEnabled }] = createResource(() => trpc.instance.branding.loginBackground.isEnabled.query(), {
    initialValue: true,
  });
  const [showSquareLogo, { mutate: setShowSquareLogo }] = createResource(() => trpc.instance.branding.squareLogo.isEnabled.query(), { initialValue: false });

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
        <div class={styles.page}>
          <Section title="Identity">
            <IdentityCard />
          </Section>
          <Section title="Login page">
            <div class={styles.grid}>
              <AssetCard
                title="Banner"
                description="Displayed above the login form."
                size={{ width: 1200, height: 400 }}
                segment="loginBanner"
                toggle={{
                  label: "Show banner",
                  value: bannerEnabled(),
                  onChange: async (value) => {
                    await trpc.instance.branding.loginBanner.setEnabled.mutate(value);
                    setBannerEnabled(value);
                  },
                }}
              />
              <AssetCard
                title="Background"
                description="Displayed behind the login page."
                size={{ width: 2560, height: 1440 }}
                segment="loginBackground"
                toggle={{
                  label: "Show background",
                  value: backgroundEnabled(),
                  onChange: async (value) => {
                    await trpc.instance.branding.loginBackground.setEnabled.mutate(value);
                    setBackgroundEnabled(value);
                  },
                }}
              />
            </div>
          </Section>
          <Section title="Logos and icons">
            <div class={styles.grid}>
              <AssetCard
                title="Favicon"
                description="Shown in the browser tab and bookmarks. Images are cropped to a square."
                size={{ width: 32, height: 32 }}
                segment="favicon"
                onUpload={(file) => trpc.instance.branding.favicon.set.mutate(file)}
              />
              <AssetCard
                title="Square logo"
                description="Shown in the navigation rail, above the applications button. Images are cropped to a square."
                size={{ width: 128, height: 128 }}
                segment="squareLogo"
                onUpload={(file) => trpc.instance.branding.squareLogo.set.mutate(file)}
                toggle={{
                  label: "Show in navigation rail",
                  value: showSquareLogo(),
                  onChange: async (value) => {
                    await trpc.instance.branding.squareLogo.setEnabled.mutate(value);
                    setShowSquareLogo(value);
                  },
                }}
              >
                <LogoLink />
              </AssetCard>
            </div>
          </Section>
          <Section title="Dashboard">
            <div class={styles.grid}>
              <AssetCard
                title="Default user background"
                description="The dashboard background for users who haven't chosen their own wallpaper."
                size={{ width: 2560, height: 1440 }}
                segment="defaultUserBackground"
                onUpload={(file) => trpc.instance.branding.defaultUserBackground.set.mutate(file)}
              />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
};

export default ManageInstanceBrandingPage;
