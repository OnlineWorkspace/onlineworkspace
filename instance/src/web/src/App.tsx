import { type Component, lazy, Suspense } from "solid-js";
import { Route, Router } from "@solidjs/router";
import { UIKitRoot } from "@tcsw/uikit-solid/src/index.tsx";
import AppIndex from "./pages/app/App.tsx";
import AuthCheck from "./pages/app/AuthCheck.tsx";
import InternalDialogueRoot from "@tcsw/uikit-solid/src/components/dialogue/InternalDialogueRoot.jsx";
import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";

const ApplicationsRouter = lazy(() => import("../../../../fs/Applications.tsx"));

const App: Component = () => {
    return (
        <UIKitRoot>
            <InternalDialogueRoot>
                <Router>
                    <Route component={lazy(() => import("./pages/userSelect/Layout.tsx"))}>
                        <Route path={"/"} component={lazy(() => import("./pages/userSelect/login/Login.tsx"))} />
                        <Route path={"/signup"} component={lazy(() => import("./pages/userSelect/signup/Signup.tsx"))} />
                        <Route
                            path={"/forgot-password"}
                            component={lazy(() => import("./pages/userSelect/forgotPassword/ForgotPassword.tsx"))}
                        />
                    </Route>
                    <Route component={AuthCheck}>
                        <Route component={lazy(() => import("./pages/app/Layout.tsx"))}>
                            <Route path={"app"}>
                                <Route path={"/"} component={AppIndex} />
                                <Suspense fallback={<UKIndeterminateSpinner />}>
                                    <ApplicationsRouter />
                                </Suspense>
                            </Route>
                            <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))} />
                        </Route>
                    </Route>
                    <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))} />
                </Router>
            </InternalDialogueRoot>
        </UIKitRoot>
    );
};

export default App;
