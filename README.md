# Prime Auto Skip + Netflix Intro

On **Prime Video**, this extension presses **Skip Intro** and **Skip Ad** when those buttons appear. When Prime Video shows an ad countdown, it attempts to seek to the end of any short, separate ad video. It does not seek the full episode timeline.

During a detected ad, it immediately mutes and accelerates media elements. It restores each element's previous mute setting and playback speed when the ad label disappears.

In ad breaks with multiple clips, it reapplies fast playback when Prime Video resets the speed and treats a short ad video returning to its start as a new clip.

On **Netflix**, it automatically clicks the existing **Skip Intro** control. It does not change Netflix ads or playback speed.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this `prime-auto-skip` folder.
4. Reload any open Prime Video and Netflix tabs.

## Limitations

Prime Video says its standard ads cannot be skipped. This extension cannot guarantee an ad bypass: Prime Video may lock seeking, ignore playback speed changes, use a separate playback clock for ads, or change its player markup. In those cases, the ad plays normally. It does not change your account or subscription.

It runs only on `primevideo.com`, the Prime Video paths on `amazon.com` and `amazon.in`, and `netflix.com`. It requests no extension API permissions, sends no data elsewhere, and does not interfere with network requests.

The button-clicking and ad-seeking techniques are also used in open source streaming extensions: [autoskipr](https://github.com/funkyremi/autoskipr) and [skippery-slope](https://github.com/epsilon003/skippery-slope). Their site-specific selectors are not copied here.

Sources: [Prime Video ad help](https://www.primevideo.com/help?nodeId=TXtSPi1i6uXutSdyGr), [Chrome content scripts](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts), [open source Netflix selector reference](https://github.com/sajjad-ahmed/netflix-auto-skip).
