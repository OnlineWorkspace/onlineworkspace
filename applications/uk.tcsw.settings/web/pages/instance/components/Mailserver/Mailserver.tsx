import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import UKTextField from "@tcsw/uikit-solid/src/components/textField/UKTextField.tsx";
import UKStackLabel from "@tcsw/uikit-solid/src/components/stack/UKStackLabel.tsx";
import styles from "./Mailserver.module.scss";
import UKCard from "@tcsw/uikit-solid/src/components/card/UKCard.jsx";
import UKButton from "@tcsw/uikit-solid/src/components/button/UKButton.jsx";
import trpc from "../../../../lib/trpc";

const Mailserver: Component = () => {
  const [host, setHost] = createSignal("smtp.example.com");
  const [port, setPort] = createSignal(587);
  const [secure, setSecure] = createSignal(true);
  const [user, setUser] = createSignal("user");
  const [pass, setPass] = createSignal("password");

  return (
    <>
      <UKStackLabel>Mailserver</UKStackLabel>
      <UKCard class={styles.card} color="filled">
        <div class={styles.hostContainer}>
          <UKTextField
            color="outlined"
            label="Host"
            defaultValue={host()}
            getValue={setHost}
          />
          <UKTextField
            color="outlined"
            label="Port"
            defaultValue={port().toString()}
            getValue={(v) => setPort(Number(v))}
          />
        </div>
        <UKTextField
          color="outlined"
          label="Username"
          defaultValue={user()}
          getValue={setUser}
        />
        <UKTextField
          color="outlined"
          label="Password"
          defaultValue={pass()}
          getValue={setPass}
          shouldMask={true}
        />
        <UKButton
          affirmative
          onClick={async () => {
            // promise which resolves after 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // trpc.instance.mailserver.set()
          }}
        >
          Save
        </UKButton>
      </UKCard>
    </>
  );
};

export default Mailserver;
