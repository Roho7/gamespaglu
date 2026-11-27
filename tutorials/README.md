# Tutorial videos

Repeatable pipeline that turns a game's spoken script plus a real captured play-through into a 1080x1920 (9:16, 30 fps) MP4. Own npm project, so app dependencies are untouched.

```
dialogue.json ─┬─> voice   ─> audio/manifest.json ─┐
               └─> capture ─> capture/markers.json ┼─> render ─> out/<game>-tutorial.mp4
                              capture/footage.webm ┘
```

Setup: `cd tutorials && npm ci && npx playwright install chromium`. Needs `ffmpeg` and `ffprobe` on PATH.

## Adding a game

1. Create `tutorials/<game>/script.md` (readable script) and `tutorials/<game>/dialogue.json` (the spoken lines, schema below).
2. Write `tutorials/capture/<game>.ts` with a default export `(rec: Recording) => Promise<void>` that drives the real app. Call `rec.mark("<shot>")` at the start of each moment, then `rec.dwell(sec)` so the footage has stillness. A PNG per shot is saved halfway through the next dwell. Use `tutorials/capture/wavelength.ts` as the model.
3. Run the stages, each as `npm run <stage> -- <game>`:

| Stage | Command | Output |
|---|---|---|
| capture | `BASE_URL=http://localhost:3000 npm run capture -- <game>` | `<game>/capture/footage.webm`, `markers.json`, one PNG per shot |
| voice | `npm run voice -- <game>` | `<game>/audio/manifest.json` |
| studio | `npm run studio -- <game>` | Remotion Studio on that game's data |
| render | `npm run render -- <game>` | `<game>/out/<game>-tutorial.mp4` |
| typecheck / lint | `npm run typecheck`, `npm run lint`, `npm run lint:fix` | |

Capture needs the app running. Use a production build (`npm run build && npm start` at the repo root): the dev server paints its overlay and "Compiling" badge into the footage. Capture seeds `Math.random` (mulberry32) so the dealt cards repeat. Playwright records at the 390x844 viewport; the footage is upscaled to 780x1688 when converted to `footage.webm`.

## Schemas

All in `pipeline/schema.ts`, parsed with zod at every file boundary.

- `Dialogue = { game, title, route, lines: Line[] }`
- `Line = { id, section: "intro"|"setup"|"gameplay"|"rounds"|"winning", text, scene, estimateSec }`
- `Scene = { kind: "footage", shot, callout? } | { kind: "infographic", graphic }`
- `Graphic = { type: "stat", icon, value, label } | { type: "list", items: { icon, value, label }[] }`
- `icon` is a key of `ICONS` in `remotion/icons.ts` (react-icons components). Add a key there to use a new icon.
- `Markers = { game, file: "footage.webm", fps?, shots: Record<string, number> }`, seconds into the footage. Capture also writes an `end` marker. A footage line plays from its shot's marker to the next marker, then freezes on the last frame if the line is longer.
- `AudioManifest = { voice, source: "higgsfield"|"placeholder", lines: { id, file, durationSec }[], totalSec }`. Line length in the video is `durationSec + 0.25 s`.

## Voice

Provider is Higgsfield only, one voice for every game, set in `voice.config.json`: model `seed_audio` (Seed Audio 1.0), preset voice Juno (`a3ce02fe-4d3e-55bc-b4d4-a4801b9acdb4`).

1. Generate one clip per line through the Higgsfield MCP connector (`claude.ai Higgsfield`): `generate_audio_batch` with `model`, `voice_type`, `voice_id` from the config, `format: "wav"`, `sample_rate: 48000`, and the line's exact `text` as `prompt`. The account allows 4 concurrent jobs, so submit in groups of 4 and poll with `jobs_wait`.
2. Download each result to `<game>/audio/raw/<id>.wav`.
3. `npm run voice -- <game>` trims leading and trailing silence from each raw clip (blips under 0.2 s don't count as speech), writes `<game>/audio/<id>.wav`, measures it with ffprobe and writes `audio/manifest.json` with `source: "higgsfield"`.

Some but not all raw clips present: error naming the missing ids. None present: placeholder manifest (`file: null`, `durationSec = estimateSec`) and a silent render that still carries an audio track.

## Gitignored

`tutorials/.gitignore`: `node_modules`, `<game>/capture/` (footage, markers, screenshots; regenerate with `capture`), `<game>/out/` (MP4, frames), `<game>/audio/*.mp3|wav` and `<game>/audio/raw/`. Committed: `script.md`, `dialogue.json`, `audio/manifest.json`.
