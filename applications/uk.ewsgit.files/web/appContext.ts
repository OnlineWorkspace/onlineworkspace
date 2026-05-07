import { type Accessor, createContext, type Setter } from "solid-js";
import type { SetStoreFunction, Store } from "solid-js/store";
import type { GlobalState, Preferences } from "./Core";
import type { Task } from "./layout/components/StatusBar/task";

export interface AppContextType {
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  userPreferences: Store<Preferences>;
  setUserPreferences: SetStoreFunction<Preferences>;
  globalState: Store<GlobalState>;
  setGlobalState: SetStoreFunction<GlobalState>;
  deletedItemCount: number;
  isDesktopApp: boolean;
  tasks: Accessor<Task[]>;
  setTasks: Setter<Task[]>;
}

const AppContext = createContext<AppContextType>(undefined);

export { AppContext };
