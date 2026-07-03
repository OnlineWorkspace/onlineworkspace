import {createContext} from "solid-js";

const UserSelectContext = createContext({
  showSignup: false,
  showProfiles: false,
  tagline: "Sample Tagline"
})

export default UserSelectContext
