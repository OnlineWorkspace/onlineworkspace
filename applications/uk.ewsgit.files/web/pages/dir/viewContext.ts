import { createContext } from "solid-js";
import type { SetStoreFunction, Store } from "solid-js/store";
import type { ViewState } from "./View";

export interface ViewContextType {
  viewState: Store<ViewState>;
  setViewState: SetStoreFunction<ViewState>;
}

const ViewContext = createContext<ViewContextType>(undefined);

export { ViewContext };
