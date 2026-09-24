(() => {
  "use strict";

  const clickedAt = new WeakMap();
  let queued = false;

  function visible(element) {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height || box.bottom <= 0 || box.right <= 0 ||
        box.top >= innerHeight || box.left >= innerWidth) return false;
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    }
    return true;
  }

  function isSkipIntro(element) {
    if (element.matches('[data-uia="player-skip-intro"]')) return true;
    const label = (element.getAttribute("aria-label") || element.textContent || "")
      .replace(/\s+/g, " ").trim();
    return /^skip intro$/i.test(label);
  }

  function scan() {
    queued = false;
    const now = Date.now();
    const seen = new Set();
    for (const control of document.querySelectorAll('[data-uia="player-skip-intro"], button')) {
      if (!isSkipIntro(control)) continue;
      const target = control.closest("button") || control.querySelector("button") || control;
      if (seen.has(target) || !visible(target)) continue;
      seen.add(target);
      if (now - (clickedAt.get(target) || 0) < 4000) continue;
      clickedAt.set(target, now);
      target.click();
    }
  }

  function scheduleScan() {
    if (queued) return;
    queued = true;
    setTimeout(scan, 100);
  }

  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-label", "class", "style", "data-uia"]
  });
  setInterval(scan, 500);
  scan();
})();
