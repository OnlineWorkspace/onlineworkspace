import {createContext} from "solid-js";

const AuthContext = createContext({
  showSignup: false,
  showProfiles: false,
  tagline: "Sample Tagline",
})

export default AuthContext
