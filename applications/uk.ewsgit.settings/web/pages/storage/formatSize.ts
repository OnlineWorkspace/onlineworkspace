/** formats a size given in megabytes */
export const formatSize = (megabytes: number) => {
  if (megabytes >= 1024) return `${(megabytes / 1024).toFixed(megabytes >= 10240 ? 0 : 1)} GB`;
  if (megabytes >= 10) return `${Math.round(megabytes)} MB`;
  if (megabytes > 0) return `${megabytes.toFixed(1)} MB`;

  return "0 MB";
};
