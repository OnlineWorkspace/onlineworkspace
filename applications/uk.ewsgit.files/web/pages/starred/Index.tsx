import type { Component } from "solid-js";
import FileBrowser from "../../components/FileBrowser";
import trpc from "../../lib/trpc";
import { createListing } from "../../lib/useListing";

const StarredPage: Component = () => {
  const listing = createListing(
    () => true,
    () => trpc.starred.list.query(),
  );

  return <FileBrowser title="Starred" entries={listing.data()} loading={listing.loading()} error={listing.error()} emptyMessage="Star files and folders to find them quickly here." showFilters showLocation />;
};

export default StarredPage;
