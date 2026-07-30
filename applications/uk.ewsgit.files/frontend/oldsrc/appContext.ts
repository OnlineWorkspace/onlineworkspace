import { type Accessor, createContext } from "solid-js";
import type { SetStoreFunction, Store } from "solid-js/store";
import type { GlobalState, Preferences } from "./Core";
import type { ViewState } from "./pages/dir/View";

export interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<Preferences>;
  setUserPreferences: SetStoreFunction<Preferences>;
  viewState: Store<{ [viewId: number]: ViewState }>;
  setViewState: SetStoreFunction<{ [viewId: number]: ViewState }>;
  globalState: Store<GlobalState>;
  setGlobalState: SetStoreFunction<GlobalState>;
  isDesktopApp: boolean;
}

const AppContext = createContext<AppContextType>(undefined);

export { AppContext };
