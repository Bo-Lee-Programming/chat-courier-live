# Chat Courier: LIVE
**Your chat is the level.**

A Twitch community game where viewers' words become signed objects on a neon delivery road. The streamer steers a lantern-carrying courier. Glow viewers create collectible stars; Mischief viewers create storm clouds. Collect 25 stars within 120 seconds while keeping the lantern lit.

## Run in under a minute
Install Node.js 22 or newer, download this repository, then run:

```sh
node server.mjs
```

Open http://127.0.0.1:8787/LIVE.html. On Windows you can double-click START-LIVE.cmd.
No npm install, build service, paid API or external art assets are needed.

Press Space to start. Steer with Up/Down, W/S, or click a lane. H hides the control panel. A toggles autopilot for rehearsals.
The rehearsal controls generate clearly simulated events. They do not prove a Twitch connection.

## Connect Twitch
1. Open http://127.0.0.1:8787/CONNECT.html.
2. In the [Twitch application console](https://dev.twitch.tv/console/apps), use an app with the exact registered redirect URL `http://127.0.0.1:8787/CONNECT.html`.
3. Enter your channel login and the app's Client ID. Click **Authorize with Twitch** and review Twitch's permissions.
4. Keep the connection page and the game controller open. Start a delivery and send a chat message from Twitch.
5. Alternatively, expand the existing-token option and supply a user access token for your own app. Never share the token in chat, recordings or the repository.

The adapter uses Twitch EventSub WebSockets. Chat requires `user:read:chat`. Channel-owner events use `channel:read:redemptions`, `channel:read:subscriptions`, and `bits:read`. Channel features and token permissions determine which subscriptions can connect; the page lists successes and unavailable subscriptions.

## What viewers do
| Input | What happens |
| --- | --- |
| `!glow` followed by ordinary chat | The viewer joins Glow; a word from each message becomes a signed star. |
| `!mischief` followed by ordinary chat | The viewer joins Mischief; words become signed clouds. |
| Channel-point redemption | Eight-second umbrella; reward titles containing storm, cloud, chaos or mischief create a five-cloud storm front. |
| Subscription, gift or resubscription | A golden gift appears in the courier's lane. |
| Bits cheer | A star or cloud shower based on the viewer's team, capped at 12 objects. |
| Incoming raid | A star parade welcomes the incoming community. |

An unassigned viewer receives a stable team based on their name. Viewers can change teams. Random lanes, incoming language and opposing crews change the road each run.

## Save a clip
Use **Record game clip** in the game panel, then **Stop and save clip**. It records only the canvas, without microphone, desktop or login fields. Clips stop automatically at 2 minutes 45 seconds and download as WebM. Keep the controller visible while recording. The on-screen rehearsal/live status is included.

## OBS browser source
Add `http://127.0.0.1:8787/LIVE.html?overlay=1` as a Browser Source at **1920 x 1080**.
The local Node server sends controller snapshots to OBS. The overlay mirrors the same courier, score, timer and objects rather than running a second game.
Keep the controller visible in its own window; browsers throttle hidden tabs. Keep the local server running.

## Files
- `LIVE.html`: canvas game, controls, effects and overlay renderer.
- `CONNECT.html`, `twitch-login.js`: connection UI and browser OAuth.
- `eventsub.js`: Twitch validation, subscriptions and normalized game events.
- `overlay-bridge.js`, `server.mjs`: same-computer controller/OBS synchronization.
- `CODEX-SESSION.json`: verified development session identifier.
- `SUBMISSION-DRAFT.md`: project description and current evidence status.

The server binds only to 127.0.0.1. Tokens stay in the connection tab's memory and go directly to Twitch, not to OBS. Reloading that page requires reconnecting.

## Built with Codex
Codex implemented the Twitch EventSub adapter, OAuth connection page, local server, overlay transport, integration fixes and release preparation. Claude assisted with the main game's canvas visuals, gameplay and overlay renderer, with explicit file ownership and a shared event contract.

Codex development session: `01a19d89-fae1-79d3-ab9f-05b92e7203f9`, verified from the local Codex session metadata.

## Verification status
The game and synchronized overlay have been exercised locally. **Authenticated Twitch demonstration and public YouTube video are pending.** Rehearsal input is not presented as real Twitch input. See the submission description for updated links when available.

