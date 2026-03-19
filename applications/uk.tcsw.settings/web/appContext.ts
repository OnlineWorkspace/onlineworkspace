import { createContext, type Accessor } from "solid-js";

const AppContext = createContext<{
  isAdministrator: Accessor<boolean>;
  shootYourselfInTheFoot: Accessor<boolean>;
  setShootYourselfInTheFoot: (value: boolean) => void;
}>({
  isAdministrator: () => false,
  shootYourselfInTheFoot: () => false,
  setShootYourselfInTheFoot: () => {},
});

export { AppContext };
