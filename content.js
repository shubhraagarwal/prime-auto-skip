(() => {
  "use strict";

  const AD_LABEL = /^(?:ad|ads|advertisement|advertising|ad\s+\d+\s+(?:of|\/)\s*\d+|ad(?:vertisement)?(?:\s+|\s*[:·-]\s*)\d{1,2}:\d{2})$/i;
  const INTRO_LABEL = /^(?:skip\s+intro|skip\s+opening|skip\s+recap)$/i;
  const SKIP_AD_LABEL = /^skip\s+(?:ad|ads|advertisement)$/i;
  const MAX_AD_SECONDS = 180;
  const AD_PLAYBACK_RATE = 16;
  const CLICK_COOLDOWN_MS = 4000;
  const lastClicked = new WeakMap();
  const adAttempts = new WeakMap();
  const accelerated = new WeakMap();
  let queued = false;

  function labelOf(element) {
    return (element.getAttribute("aria-label") || element.textContent || element.value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function visible(element) {
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.bottom > 0 && box.right > 0 &&
      box.top < innerHeight && box.left < innerWidth;
  }

  function overlapsPlayer(element, video) {
    const a = element.getBoundingClientRect();
    const b = video.getBoundingClientRect();
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function playerVideos() {
    return [...document.querySelectorAll("video")].filter(visible);
  }

  function restorePlayback(video) {
    const original = accelerated.get(video);
    if (!original) return;
    accelerated.delete(video);
    video.playbackRate = original.playbackRate;
    video.muted = original.muted;
  }

  function accelerateAd(video) {
    if (!accelerated.has(video)) {
      accelerated.set(video, { playbackRate: video.playbackRate, muted: video.muted });
    }
    try {
      if (!video.muted) video.muted = true;
      if (video.playbackRate !== AD_PLAYBACK_RATE) video.playbackRate = AD_PLAYBACK_RATE;
    } catch (_) {
      restorePlayback(video);
    }
  }

  function clickSkipControls() {
    const now = Date.now();
    const controls = document.querySelectorAll("button, [role='button'], input[type='button']");
    for (const control of controls) {
      if (!visible(control)) continue;
      const label = labelOf(control);
      if (!INTRO_LABEL.test(label) && !SKIP_AD_LABEL.test(label) && !control.matches(".adSkipButton")) continue;
      if (now - (lastClicked.get(control) || 0) < CLICK_COOLDOWN_MS) continue;
      lastClicked.set(control, now);
      control.click();
    }
  }

  function adCountdown(video) {
    const candidates = document.querySelectorAll("[aria-label], [data-testid], span, div");
    let genericAdFound = false;
    for (const element of candidates) {
      if (element.children.length > 2 || !visible(element) || !overlapsPlayer(element, video)) continue;
      const labels = [element.textContent || "", element.getAttribute("aria-label") || ""];
      for (const rawLabel of labels) {
        const label = rawLabel.replace(/\s+/g, " ").trim();
        const spokenTimer = label.match(/^Ad playing\.\s*Content resumes in\s*(\d+)\s*minutes?\s+and\s+(\d+)\s*seconds?\.?$/i);
        if (spokenTimer) return Number(spokenTimer[1]) * 60 + Number(spokenTimer[2]);
        if (label.length > 40 || !AD_LABEL.test(label)) continue;
        const match = label.match(/\b(?:ad|advertisement)\s*[:·-]?\s*(\d{1,2}):(\d{2})$/i);
        if (match) return Number(match[1]) * 60 + Number(match[2]);
        genericAdFound = true;
      }
    }
    return genericAdFound ? null : undefined;
  }

  function seekPastAd(video) {
    const remaining = adCountdown(video);
    if (remaining === undefined) {
      adAttempts.delete(video);
      return;
    }
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration < 2 || duration > MAX_AD_SECONDS) return;
    const previous = adAttempts.get(video);
    const newClip = previous && previous.reachedEnd && video.currentTime < Math.min(3, duration / 5);
    if (previous && !newClip) return;
    const target = duration - 0.1;
    if (target - video.currentTime < 1) return;
    try {
      video.currentTime = target;
      adAttempts.set(video, { reachedEnd: video.currentTime >= duration - 1 });
    } catch (_) {
      // Prime Video may reject seeking during a mid-roll ad.
      adAttempts.set(video, { reachedEnd: false });
    }
  }

  function scan() {
    queued = false;
    clickSkipControls();
    const videos = playerVideos();
    const media = document.querySelectorAll("video,audio");
    if (videos.some(video => adCountdown(video) !== undefined)) {
      for (const element of media) accelerateAd(element);
      for (const video of videos) seekPastAd(video);
    } else {
      for (const element of media) {
        restorePlayback(element);
        adAttempts.delete(element);
      }
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
    attributeFilter: ["aria-label", "class", "style"]
  });
  setInterval(scan, 1000);
  scan();
})();
