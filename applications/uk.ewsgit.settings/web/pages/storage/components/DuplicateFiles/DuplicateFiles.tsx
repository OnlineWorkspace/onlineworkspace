import UKStack from "@ewsgit/uikit-solid/src/components/stack/UKStack.jsx";
import UKStackItem from "@ewsgit/uikit-solid/src/components/stack/UKStackItem.jsx";
import type { Component } from "solid-js";

const DuplicateFiles: Component = () => {
  return (
    <>
      <UKStack>
        <UKStackItem labelText={"404.png"} supportingText={"10KB"} />
      </UKStack>
    </>
  );
};

export default DuplicateFiles;
