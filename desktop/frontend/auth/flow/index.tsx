import { A } from "@solidjs/router";
import { type Component, createResource } from "solid-js";
import styles from "./index.module.scss";
import { Title } from "@solidjs/meta";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import UKDivider from "@ewsgit/uikit-solid/src/components/divider/UKDivider.tsx";
import {
  type AppConfiguration,
  CORE_BINDING_PREFIX,
  CoreBindingEndpoints,
} from "@onlineworkspace/desktop";
import {
  AUTH_BINDING_PREFIX,
  AuthBindingEndpoints,
} from "../../../desktop/auth.ts";

const AuthAppFlowPage: Component = () => {
  const [appConfiguration] = createResource<AppConfiguration>(() =>
    // @ts-ignore
    bindings[`${CORE_BINDING_PREFIX}${CoreBindingEndpoints.GetConfiguration}`]()
  );
  const [instanceUrl] = createResource(() =>
    // @ts-ignore
    bindings[`${AUTH_BINDING_PREFIX}${AuthBindingEndpoints.GetInstanceUrl}`]()
  );

  return (
    <>
      <Title>
        Authenticate to OnlineWorkspace @ {instanceUrl()}
      </Title>
      <div class={styles.root}>
        <div class={styles.sidePanel}>
          <UKText role="display" size="l" emphasized>
            Sign in
          </UKText>
          <UKText role="label" size="l">
            To authorize '{appConfiguration()?.displayName ||
              appConfiguration()?.applicationId}'
          </UKText>
          <UKText role="label" size="l" class={styles.footer}>
            OnlineWorkspace @{" "}
            <A
              href={`${appConfiguration()?.frontendBasePath}/ow_desktop_integration/auth/select_instance`}
            >
              {instanceUrl()}
            </A>
          </UKText>
        </div>
        <UKDivider direction="vertical" />
        <div>
          Place Login UI Component Here
        </div>
      </div>
    </>
  );
};

export default AuthAppFlowPage;
