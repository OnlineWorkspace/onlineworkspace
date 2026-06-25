import {type Component, createSignal} from "solid-js";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.tsx";
import UKSwitch from "@ewsgit/uikit-solid/src/components/switch/UKSwitch.tsx";

const ShowSquareLogoInNavigation: Component = () => {
  const [showSquareLogo, setShowSquareLogo] = createSignal<boolean>(false)

  return (
    <UKStackItem
      labelText={"Show Square Logo In The Navigation Rail"}
      supportingText={"Show the square logo image in the app navigation rail, this is displayed above the user profile avatar and below the menu expansion toggle button"}
      inlineComponent={<UKSwitch value={showSquareLogo()} onValueChange={setShowSquareLogo} />}
    >
    </UKStackItem>
  );
};

export default ShowSquareLogoInNavigation;
