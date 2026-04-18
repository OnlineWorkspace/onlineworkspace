import UKCircularProgressIndicator from "@onlineworkspace/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.jsx";
import { baselineTheme } from "@onlineworkspace/uikit-solid/src/core/design/themes/baseline.js";
import { applyTheme } from "@onlineworkspace/uikit-solid/src/core/design/tokens.js";
import { Ref } from "@solid-primitives/refs";
import type { RouteSectionProps } from "@solidjs/router";
import { type Component, createEffect, createSignal, lazy, Suspense } from "solid-js";
import trpc from "../../lib/trpc.ts";
import styles from "./Layout.module.scss";

const AppNavigation = lazy(() => import("./Navigation.tsx"));

const AppLayout: Component<RouteSectionProps<unknown>> = (props) => {
  const [ref, setRef] = createSignal<Element | undefined>(undefined);
  const isLightMode = window.matchMedia("(prefers-color-scheme: light)").matches;

  createEffect(async () => {
    const refElement = ref();
    if (!refElement) {
      return;
    }

    const uikitRoot = refElement?.closest('[data-uikit-root="true"]') as HTMLDivElement | undefined;

    if (!uikitRoot) {
      console.warn("Could not find uikit root element. AppNavigation may not be rendered correctly.");
      return;
    }

    const userTheme = await trpc.theme.get.query();

    if (userTheme === false) return;

    const parsedUserTheme = {
      ...baselineTheme,
      sys: {
        ...baselineTheme.sys,
        color: {
          ...baselineTheme.sys.color,
          ...userTheme,
        },
      },
    };

    applyTheme(parsedUserTheme, uikitRoot, isLightMode ? "light" : "dark");
  });

  return (
    <>
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
    </>
  );
};

export default AppLayout;
