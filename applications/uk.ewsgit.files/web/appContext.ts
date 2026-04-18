import { createContext } from "solid-js";
import type { AppContextType } from "./App.tsx";

const AppContext = createContext<AppContextType>();

export { AppContext };
