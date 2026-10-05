const PREVIEW_WIDTH = 504;

/**
 * The size to request the wallpaper at for previews: the same aspect ratio as this screen, which is what
 * the dashboard requests, just scaled down.
 */
export function previewWallpaperDimensions(): { width: number; height: number } {
  return {
    width: PREVIEW_WIDTH,
    height: Math.max(1, Math.round((PREVIEW_WIDTH * screen.height) / screen.width)),
  };
}
