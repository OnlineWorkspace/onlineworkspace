import type { SetStoreFunction } from "solid-js/store";
import type { StepNavigation } from "../components/ChoiceStep/ChoiceStep";
import type { SetupDefaults, SetupState } from "../state";

export interface StepProps extends StepNavigation {
  state: SetupState;
  setState: SetStoreFunction<SetupState>;
  defaults: SetupDefaults;
  token: string;
  custom: boolean;
  onCustomChange(custom: boolean): void;
}
