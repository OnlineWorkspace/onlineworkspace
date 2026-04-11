import UKButton from "@onlineworkspace/uikit-solid/src/components/button/UKButton.jsx";
import UKStackLabel from "@onlineworkspace/uikit-solid/src/components/stack/UKStackLabel.tsx";
import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";

const InstalledApplications: Component = () => {
  const navigate = useNavigate();

  return (
    <>
      <UKStackLabel>Installed Applications</UKStackLabel>
      <UKButton color={"filled"} onClick={() => navigate("/app/uk.ewsgit.store/manage-installed")}>
        View installed applications in the Store
      </UKButton>
    </>
  );
};

export default InstalledApplications;
