import {UIKitRoot} from "@ewsgit/uikit-solid/src/index.tsx";
import {MetaProvider} from "@solidjs/meta";
import {Route, Router} from "@solidjs/router";
import {type Component, lazy} from "solid-js";
import styles from "./App.module.scss";
import ApplicationsRouter from "./ApplicationsRouter.tsx";
import MissingApp from "./MissingApp.tsx";
import AppIndex from "./pages/app/Index.tsx";
import Redirect from "./components/Redirect.js";

const App: Component = () => {
    return (<UIKitRoot class={styles.root}>
            <MetaProvider>
                <Router>
                    <Route path={"/"} component={() => <Redirect to={"/auth/login"}/>}/>
                    <Route path={"/auth"} component={lazy(() => import("./pages/auth/Layout.tsx"))}>
                        <Route path={"/login"} component={lazy(() => import("./pages/auth/login/Layout.tsx"))}/>
                        <Route path={"/login/standard"}
                               component={lazy(() => import("./pages/auth/login/standard/Standard.tsx"))}/>
                        <Route path={"/login/forgot-password"}
                               component={lazy(() => import("./pages/auth/login/forgotPassword/ForgotPassword.tsx"))}/>
                        <Route path={"/signup"} component={lazy(() => import("./pages/auth/signup/Signup.tsx"))}/>
                        <Route component={lazy(() => import("./pages/auth/app/flow.tsx"))} path="app/flow"/>
                    </Route>
                    <Route component={lazy(() => import("./pages/app/AuthCheck.tsx"))}>
                        <Route component={lazy(() => import("./pages/app/Layout.tsx"))}>
                            <Route path={"app"}>
                                <Route path={"/"} component={AppIndex}/>
                                <ApplicationsRouter/>
                                <Route path={":applicationId"} component={MissingApp}/>
                            </Route>
                            <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))}/>
                        </Route>
                    </Route>
                    <Route path={"*"} component={lazy(() => import("./pages/notFound/Index.tsx"))}/>
                </Router>
            </MetaProvider>
        </UIKitRoot>);
};

export default App;
