import { type Component, lazy, Suspense } from "solid-js";
import { Route, Router } from "@solidjs/router";
import { UIKitRoot } from "@tcsw/uikit-solid/src/index.tsx";
import AppIndex from "./pages/app/App.tsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";
import styles from "./App.module.scss";

const ApplicationsRouter = lazy(() => import("../../../../fs/Applications.tsx"));

const App: Component = () => {
    return (
        <UIKitRoot class={styles.root}>
            <Suspense fallback={<UKIndeterminateSpinner class={styles.spinner} />}>
                <Router>
                    <Route component={lazy(() => import("./pages/userSelect/Layout.tsx"))}>
                        <Route
                            path={"/"}
                            component={lazy(() => import("./pages/userSelect/login/Login.tsx"))}
                        />
                        <Route
                            path={"/signup"}
                            component={lazy(() => import("./pages/userSelect/signup/Signup.tsx"))}
                        />
                        <Route
                            path={"/forgot-password"}
                            component={lazy(
                                () =>
                                    import("./pages/userSelect/forgotPassword/ForgotPassword.tsx"),
                            )}
                        />
                    </Route>
                    <Route component={lazy(() => import("./pages/app/AuthCheck.tsx"))}>
                        <Route component={lazy(() => import("./pages/app/Layout.tsx"))}>
                            <Route path={"app"}>
                                <Route path={"/"} component={AppIndex} />
                                <Suspense fallback={<UKIndeterminateSpinner />}>
                                    <ApplicationsRouter />
                                </Suspense>
                            </Route>
                            <Route
                                path={"*"}
                                component={lazy(() => import("./pages/notFound/Index.tsx"))}
                            />
                        </Route>
                    </Route>
                    <Route
                        path={"*"}
                        component={lazy(() => import("./pages/notFound/Index.tsx"))}
                    />
                </Router>
            </Suspense>
        </UIKitRoot>
    );
};

export default App;
