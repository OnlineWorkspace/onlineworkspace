import { createContext } from "solid-js";

const CoreApplicationLayoutContext = createContext({ refetchQuickShortcuts: () => {} });

export default CoreApplicationLayoutContext;
