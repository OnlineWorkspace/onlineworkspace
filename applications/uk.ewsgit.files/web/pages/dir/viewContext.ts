import { createContext } from "solid-js";

export interface ViewContextType {
  viewId: number;
}

const ViewContext = createContext<ViewContextType>(undefined);

export { ViewContext };
