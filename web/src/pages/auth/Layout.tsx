import UKCircularProgressIndicator
    from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";
import UKText from "@ewsgit/uikit-solid/src/components/text/UKText.tsx";
import {type RouteSectionProps, useNavigate} from "@solidjs/router";
import {type Component, createResource, onMount, Show, Suspense} from "solid-js";
import backend from "../../lib/backend";
import styles from "./Layout.module.scss";
import AuthContext from "./authContext.ts";
import trpc from "../../lib/trpc.ts";
import useIsMobile from "@ewsgit/uikit-solid/src/core/useIsMobile.ts";

const UserSelectLayout: Component<RouteSectionProps<unknown>> = (props) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [options, { mutate: mutateOptions }] = createResource(async () => {
        // the setup wizard is shown at / until the instance has been set up, and setup mode can't answer the login page's queries
        if (!(await trpc.setup.status.query()).complete) {
            navigate("/");
            return undefined;
        }

        const data = await trpc.userSelect.getOptions.query();

        return {
            ...data,
            showProfiles: isMobile() ? false : data.showProfiles
        }
    })

    onMount(async () => {
        // the resource above redirects to the wizard, setup mode has no authorization procedures
        if (!(await trpc.setup.status.query()).complete) return;

        const {authenticated: isAuthenticated} = await trpc.authorization.isAuthenticated.query()

        if (isAuthenticated) {
            navigate("/app");
        }
    });


    return (<Show when={options() !== undefined}>
            <AuthContext.Provider value={options()!}>
                <div class={styles.root}>
                    <Suspense fallback={<UKCircularProgressIndicator/>}>
                        <Show when={options()?.showBackground}>
                            <img class={styles.background} alt="" src={backend("/api/instance/login/background")}/>
                            <div class={styles.scrim}/>
                        </Show>
                        <Show when={options()?.showBanner}>
                            <img class={styles.banner} alt="" src={backend("/api/instance/login/banner")}/>
                        </Show>
                        <main class={styles.content}>
                            {props.children}
                        </main>
                    </Suspense>
                    <footer class={styles.footer}>
                        <UKText role={"body"} size={"s"} class={styles.tagline}>
                            {options()?.tagline}
                        </UKText>
                        <UKText href="https://ewsgit.uk" role={"body"} size={"s"} class={styles.copyright}>
                            Copyright © 2025-2026 Ewsgit
                        </UKText>
                    </footer>
                </div>
            </AuthContext.Provider>
        </Show>);
};

export default UserSelectLayout;
