/** Where a menu opens when it hangs from the right edge of the button that was pressed. */
export const menuBelow = (button: HTMLElement) => {
  const rect = button.getBoundingClientRect();

  return { x: Math.max(8, window.innerWidth - rect.right), y: rect.bottom + 4, align: "left" as const };
};
