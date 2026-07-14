import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import ERROR_ICON from "@material-symbols/svg-700/outlined/error.svg";
import STORE_ICON from "@material-symbols/svg-700/outlined/store.svg"
import UKButton from "@ewsgit/uikit-solid/src/components/button/UKButton.tsx";
import UKButtonGroup from "@ewsgit/uikit-solid/src/components/buttonGroup/UKButtonGroup.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import UKIcon from "@ewsgit/uikit-solid/src/components/icon/UKIcon.tsx";
import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.tsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKStackLabel from "@ewsgit/uikit-solid/src/components/stack/UKStackLabel.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKTopAppBar from "@ewsgit/uikit-solid/src/components/topAppBar/UKTopAppBar.tsx";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../../lib/trpc.ts";
import BooleanSetting from "./components/BooleanSetting/BooleanSetting";
import StringListSetting from "./components/StringListSetting/StringListSetting.tsx";
import StringSetting from "./components/StringSetting/StringSetting.tsx";
import styles from "./Index.module.scss";

const ApplicationPage: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const [data] = createResource(() => trpc.application.getApplication.query({ id: params.applicationId! }));

  return (
    <>
      <UKTopAppBar
        type="small"
        headline={data()?.displayName}
        leadingButton={{
          icon: CHEVRON_LEFT_ICON,
          onClick() {
            navigate(searchParams.origin?.toString() ?? "/app/uk.ewsgit.settings/applications");
          },
          accessibleLabel: "Go back",
        }}
      />
      <div class={styles.page}>
        <div class={styles.pageHeader}>
          {data()?.icon.type === "icon" ? (
            <UKIcon class={styles.icon}>{data()?.icon.value || ERROR_ICON}</UKIcon>
          ) : (
            <img class={styles.image} alt={""} src={data()?.icon.value || "/assets/tricolor/tricolor_icon@4x.png"} />
          )}
          <div class={styles.headerContent}>
            <UKText role={"display"} size={"l"}>
              {data()?.displayName}
            </UKText>
            <UKText class={styles.id} role={"label"} size={"l"}>
              ({params.applicationId})
            </UKText>
            <UKButtonGroup size={"s"} align={"start"}>
              <UKButton
                onClick={() => {
                  // Fixme: somehow we need to figure out what repo the app is hosted on? maybe the store is in need of a redesigned path for applications
                  navigate(`/app/uk.ewsgit.store/app/local/${params.applicationId}?origin=/app/uk.ewsgit.settings/applications/${params.applicationId}`);
                }}
                color={"tonal"}
                leadingIcon={STORE_ICON}
              >
                View Store Page
              </UKButton>
              <UKButton
                onClick={() => {
                  // Fixme: somehow we need to figure out what repo the app is hosted on? maybe the store is in need of a redesigned path for applications
                  navigate(`/app/${params.applicationId}`);
                }}
                color={"filled"}
              >
                Open
              </UKButton>
            </UKButtonGroup>
          </div>
        </div>
        <UKDivider direction={"horizontal"} />
        <UKStackLabel>User Settings</UKStackLabel>
        <UKStack>
          {!data()?.settings.find((s) => !s.global) && (
            <UKText role={"body"} size={"l"} align={"center"}>
              This application has no user settings to configure.
            </UKText>
          )}
          <For each={data()?.settings}>
            {(setting) => {
              if (setting.global) return null;
              switch (setting.type) {
                case "boolean":
                  return (
                    <BooleanSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                case "string":
                  return (
                    <StringSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                case "stringList":
                  return (
                    <StringListSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                default:
                  return <UKStackItem labelText={setting.displayName} supportingText={setting.id} />;
              }
            }}
          </For>
        </UKStack>
        <UKStackLabel>Global Settings</UKStackLabel>
        <UKStack>
          {!data()?.settings.find((s) => s.global) && (
            <UKText role={"body"} size={"l"} align={"center"}>
              This application has no global settings to configure.
            </UKText>
          )}
          <For each={data()?.settings}>
            {(setting) => {
              if (!setting.global) return null;
              switch (setting.type) {
                case "boolean":
                  return (
                    <BooleanSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                case "string":
                  return (
                    <StringSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                case "stringList":
                  return (
                    <StringListSetting
                      id={setting.id}
                      description={setting.description}
                      currentValue={setting.currentValue}
                      defaultValue={setting.defaultValue}
                      displayName={setting.displayName}
                    />
                  );
                default:
                  return <UKStackItem labelText={setting.displayName} supportingText={setting.id} />;
              }
            }}
          </For>
        </UKStack>
      </div>
    </>
  );
};

export default ApplicationPage;
