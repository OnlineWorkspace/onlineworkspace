import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";

const TemporaryFiles: Component = () => {
  return (
    <>
      <UKStack>
        <UKStackItem labelText={"Clear Cache Files"} supportingText={"Save 10KB"} />
        <UKStackItem labelText={"Clear Temp Files"} supportingText={"Save 10KB"} />
      </UKStack>
    </>
  );
};

export default TemporaryFiles;
