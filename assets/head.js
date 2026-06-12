/* Runs in <head> before first paint: enable animations only when the user has
   not requested reduced motion (avoids a flash, keeps motion accessible). */
try {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("js-anim");
  }
} catch (e) {}
