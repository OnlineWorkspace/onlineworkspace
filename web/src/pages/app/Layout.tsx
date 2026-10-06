import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import { baselineTheme } from "@ewsgit/uikit-solid/src/core/design/themes/baseline.js";
import { applyTheme } from "@ewsgit/uikit-solid/src/core/design/tokens.js";
import { Ref } from "@solid-primitives/refs";
import type { RouteSectionProps } from "@solidjs/router";
import { type Component, createEffect, createResource, createSignal, lazy, Show, Suspense } from "solid-js";
import { useColorMode } from "../../lib/colorMode.ts";
import trpc from "../../lib/trpc.ts";
import styles from "./Layout.module.scss";
import TwoFactorGate from "./TwoFactorGate/TwoFactorGate.tsx";

const AppNavigation = lazy(() => import("./Navigation.tsx"));

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
  const [ref, setRef] = createSignal<Element | undefined>(undefined);
  const { isLight, systemIsLight } = useColorMode();
  const [userTheme] = createResource(() => trpc.theme.get.query().catch(() => false as const));
  // an administrator has to set up two factor authentication before anything else works
  const [security] = createResource(() => trpc.authorization.securityStatus.query().catch(() => ({ twoFactorSetupRequired: false })));

  createEffect(() => {
    const refElement = ref();
    if (!refElement) {
      return;
    }

    const uikitRoot = refElement.closest('[data-uikit-root="true"]') as HTMLDivElement | undefined;

    if (!uikitRoot) {
      console.warn("Could not find uikit root element. AppNavigation may not be rendered correctly.");
      return;
    }

    // the uikit root re-applies its own theme whenever the system mode changes, so re-assert ours after it
    systemIsLight();
    const theme = userTheme();
    const mode = isLight() ? "light" : "dark";

    // applied even without a custom theme so the light/dark preference overrides the system setting
    const parsedUserTheme = {
      ...baselineTheme,
      sys: {
        ...baselineTheme.sys,
        color: {
          ...baselineTheme.sys.color,
          ...(theme || {}),
        },
      },
    };

    applyTheme(parsedUserTheme, uikitRoot, mode);

    document.documentElement.style.colorScheme = mode;
    const rootStyles = document.head.querySelector("[data-uikit-root-styles]");
    if (rootStyles) {
      const colors = parsedUserTheme.sys.color[isLight() ? "lightMode" : "darkMode"] as Record<string, string>;
      const background = colors.background;
      rootStyles.innerHTML = `:root {\n  background-color: ${background.startsWith("#") ? background : `rgb(${background})`};\n}`;
    }
  });

  return (
    <Show when={!security.loading} fallback={<UKCircularProgressIndicator />}>
      <Show when={!security()?.twoFactorSetupRequired} fallback={<TwoFactorGate />}>
        {window.localStorage.getItem("onlineworkspace_workspace_no_app_navigation_rail") !== "true" ? (
          <Ref ref={setRef}>
            <AppNavigation>
              <Suspense fallback={<UKCircularProgressIndicator />}>{props.children}</Suspense>
            </AppNavigation>
          </Ref>
        ) : (
          <Ref ref={setRef}>
            <div class={styles.page}>
              <Suspense fallback={<UKCircularProgressIndicator />}>{props.children}</Suspense>
            </div>
          </Ref>
        )}
      </Show>
    </Show>
  );
};

export default AppLayout;
