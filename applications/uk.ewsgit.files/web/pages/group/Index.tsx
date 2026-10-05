import { useNavigate, useParams } from "@solidjs/router";
import type { Component } from "solid-js";
import FileBrowser from "../../components/FileBrowser";
import { routes } from "../../lib/routes";
import trpc from "../../lib/trpc";
import { type FileGroup, GROUPS } from "../../lib/types";
import { createListing } from "../../lib/useListing";

const GroupPage: Component = () => {
  const params = useParams<{ group: string }>();
  const navigate = useNavigate();

  const group = () => GROUPS.find((candidate) => candidate.id === params.group);
  const listing = createListing(
    () => group()?.id,
    (id: FileGroup) => trpc.group.query({ group: id }),
  );

  return (
    <FileBrowser
      title={group()?.label ?? "Unknown category"}
      entries={listing.data()}
      loading={listing.loading()}
      error={group() ? listing.error() : "That category does not exist"}
      emptyMessage={`No ${group()?.label.toLowerCase() ?? "files"} yet.`}
      showFilters
      showLocation
      onBack={() => navigate(routes.home())}
    />
  );
};

export default GroupPage;
