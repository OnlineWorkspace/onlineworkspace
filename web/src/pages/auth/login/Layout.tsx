import {type Component, Show, useContext} from "solid-js";
import LoginProfilesPage from "./profiles/Profiles.js";
import LoginStandardPage from "./standard/Standard.js";
import AuthContext from "../authContext.js";

const LoginLayout: Component = () => {
  const options = useContext(AuthContext)

  return <>
    <Show when={options.showProfiles}>
      <LoginProfilesPage/>
    </Show>
    <Show when={!options.showProfiles}>
      <LoginStandardPage/>
    </Show>
  </>
}

export default LoginLayout;
