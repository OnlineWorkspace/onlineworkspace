import CHEVRON_LEFT_ICON from "@material-symbols/svg-700/outlined/chevron_left.svg";
import { useNavigate, useParams } from "@solidjs/router";
import UKIconButton from "@tcsw/uikit-solid/src/components/iconButton/UKIconButton.jsx";
import UKText from "@tcsw/uikit-solid/src/components/text/UKText.jsx";
import { type Component, createResource, For } from "solid-js";
import trpc from "../../../lib/trpc";

const SearchPeoplePage: Component = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [people] = createResource(() => trpc.search.people.query(""), { initialValue: [] });

  return (
    <div>
      <div>
        <UKIconButton
          icon={CHEVRON_LEFT_ICON}
          alt="Go Back"
          onClick={() => {
            navigate("/app/uk.tcsw.photos/search");
          }}
        />
        <UKText role="title" size="l">
          {params.query}
        </UKText>
        <For each={people()}>
          {(person) => {
            return <>{person()}</>;
          }}
        </For>
      </div>
    </div>
  );
};

export default SearchPeoplePage;
