import type { Component } from "solid-js";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import { useNavigate } from "@solidjs/router";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";

const InstalledApplications: Component = () => {
    const navigate = useNavigate();

    return (
      <>
        <UKStackLabel>Installed Applications</UKStackLabel>
        <UKButton
          color={"filled"}
          onClick={() => navigate("/app/uk.tcsw.store/manage-installed")}
        >
          View installed applications in the Store
        </UKButton>
      </>
    );
};

export default InstalledApplications;
