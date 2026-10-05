import type { Component } from "solid-js";
import FileBrowser from "../../components/FileBrowser";
import trpc from "../../lib/trpc";
import { createListing } from "../../lib/useListing";

const RecentPage: Component = () => {
  const listing = createListing(
    () => true,
    () => trpc.recent.query(),
  );

  return <FileBrowser title="Recent" entries={listing.data()} loading={listing.loading()} error={listing.error()} emptyMessage="Files you add or change will show up here." showFilters showLocation />;
};

export default RecentPage;
