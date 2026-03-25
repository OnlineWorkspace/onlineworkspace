import type { RouteSectionProps } from "@solidjs/router";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import type { Component } from "solid-js";

const NotFoundPage: Component<RouteSectionProps<unknown>> = () => {
  return (
    <div>
      <UKText emphasized={true} size="l" role="display">
        404 - Not Found
      </UKText>
    </div>
  );
};

export default NotFoundPage;
