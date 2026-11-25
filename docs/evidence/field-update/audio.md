# Meridian audio audition

[Play the 15-second stereo clip](https://r4-laboratories.github.io/uor-cs1.618/media/meridian-audio.mp3) · [Download the MP3](meridian-audio.mp3)

| Seconds | What to listen for |
| --- | --- |
| 0.20–5.80 | One report each from the P9, Rivet, Vector, Kestrel, Sentinel, Tern, Breaker and Longbow. |
| 6.25–9.20 | Two running footsteps per surface, in order across asphalt, stone pavers, metal grating and wood. |
| 9.65 | A landing on the grating. |
| 10.30–11.70 | The Tern is equipped, gives an empty trigger click, and starts and finishes a reload. The sequence condenses the pause between reload cues. |
| 12.18–14.10 | The same Kestrel plays in a nearby arcade, then from a distance to the left, then behind cover to the right. |

The recording uses the game's Web Audio mixer with a fixed sequence of events and listener positions. The samples are synthesized from the same original percussion patches used in multiplayer. To render it again, run `node scripts/render-foley-demo.mjs` with Playwright Chromium and FFmpeg installed.

Valve’s sound design notes informed the focus on positional clarity, environment response and variation between surface contacts. [Counter-Strike 2 audio overview](https://www.counter-strike.net/cs2) · [CS:GO surface sound release notes](https://blog.counter-strike.net/2015/11/13087/)
