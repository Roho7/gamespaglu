# Tutorial videos

Repeatable pipeline that turns a game's spoken script plus a real captured play-through into a 1080x1920 (9:16, 30 fps) MP4. Own npm project, so app dependencies are untouched.

```
dialogue.json ─┬─> voice   ─> audio/manifest.json ─┐
               └─> capture ─> capture/markers.json ┼─> render ─> out/<game>-tutorial.mp4
                              capture/footage.mp4 ┘
```

Setup: `cd tutorials && npm ci && npx playwright install chromium`. Needs `ffmpeg` and `ffprobe` on PATH.

## Adding a game

1. Create `tutorials/<game>/script.md` (readable script) and `tutorials/<game>/dialogue.json` (the spoken lines, schema below).
2. Write `tutorials/capture/<game>.ts` with a default export `(rec: Recording) => Promise<void>` that drives the real app. Call `rec.mark("<shot>")` at the start of each moment, then `rec.dwell(sec)` so the footage has stillness. A PNG per shot is saved halfway through the next dwell. Call `rec.focus("<name>", locator)` while a part of the screen a line will zoom to is on screen: it stores the box of the element's content (its text, not its padding or border) for `scene.zooms`. Point it at the text span inside a button, not the button. Use `tutorials/capture/wavelength.ts` and `tutorials/capture/who-am-i.ts` as models.
3. Run the stages, each as `npm run <stage> -- <game>`:

| Stage | Command | Output |
|---|---|---|
| capture | `BASE_URL=http://localhost:3000 npm run capture -- <game>` | `<game>/capture/footage.mp4`, `markers.json`, one PNG per shot |
| voice | `npm run voice -- <game>` | `<game>/audio/manifest.json` |
| studio | `npm run studio -- <game>` | Remotion Studio on that game's data |
| render | `npm run render -- <game>` | `<game>/out/<game>-tutorial.mp4` |
| frames | `npm run frames -- <game>` | `<game>/out/frames/`: one PNG per line (start + 1 s), per cue (cue word + 0.3 s) and per zoom (zoom word + 0.8 s), for checking the render |
| typecheck / lint | `npm run typecheck`, `npm run lint`, `npm run lint:fix` | |

Capture needs the app running. Use a production build (`npm run build && npm start` at the repo root): the dev server paints its overlay and "Compiling" badge into the footage. Capture seeds `Math.random` (mulberry32) so the dealt cards repeat.

The viewport is 432x768 CSS px at device scale 2.5, so the screen is exactly 1080x1920 (9:16) and fills the video with no crop. Playwright's `recordVideo` only records at viewport resolution, so capture uses CDP `Page.startScreencast` (jpeg quality 90, 1080x1920, every frame), keeps each frame's `metadata.timestamp`, sorts frames by it (Chromium occasionally delivers them out of order), and encodes `footage.mp4` at constant 30 fps with ffmpeg concat using the real frame durations. Marker times are seconds since recording start on the same clock. `rec.dwell(sec)` also records where that shot's last dwell ended (`ends`), so a shot never plays into the unmarked setup before the next one.

The composition has no phone frame or background: the footage is the frame and everything else (section label, callout, infographic card, captions) is an overlay plate on top of it.

## Look and cadence

- **Zoom to focus.** A `scene.zooms` entry eases the footage in on a focus box (cubic in-out, about 0.45 s each way), holds, and eases back out. It starts 4 frames before its `word` (default: the line start) and is back out 14 frames after its `until` word ends (default: the line end). Scale fits the box to most of the frame, from 1.2x to 2.2x, and the box is pulled towards the centre without ever showing past the footage edge (`remotion/zoom.ts`).
- **Captions** are one line of up to 26 characters, 46 px bold on a translucent plate in the game's shadow colour, with the spoken word highlighted. They sit just above the bottom action band. When a line zooms to something that would end up under them, or the line has a callout, they move to the top (`remotion/Captions.tsx`, `captionPlace` in `remotion/data.ts`).
- **Gaps follow the subject** (`pipeline/timing.ts`). A line's `subject` defaults to its `section`. If the next line has the same subject, the gap after this one is 0.1 s; if the subject changes, or this is the last line, it is 0.65 s. Give lines in one section different subjects to put a beat between them (one per mode or setting), and give consecutive lines the same subject to run them back to back.
- **Palette.** `dialogue.palette` colours every overlay; it defaults to Wavelength's Miami. Copy the game's palette from `src/lib/palettes.ts`.

## Schemas

All in `pipeline/schema.ts`, parsed with zod at every file boundary.

- `Dialogue = { game, title, route, palette?, sectionLabels?, lines: Line[] }`. `sectionLabels` renames a section's on-screen label (Who Am I shows `rounds` as "decks & settings").
- `Line = { id, section: "intro"|"setup"|"gameplay"|"rounds"|"winning", subject?, text, scene, estimateSec }`
- `Scene = { shot, cues?: { word, shot }[], zooms?: { focus, word?, until? }[], callout?, graphic? }`. `zooms[].focus` names a box from `rec.focus`; `word` and `until` are word indices like cues, and zooms must be in order and not overlap (checked by the schema). Every line is footage. `shot` plays from the line start. `cues[].word` is a 0-based index into `text.split(/\s+/)`: when that word is spoken the video cuts to that cue's shot (4-frame crossfade). Cues must be in range and in word order (checked by the schema). `callout` and `graphic` are overlays on the footage.
- `Graphic = { type: "stat", icon, value, label } | { type: "list", items: { icon, value, label }[] }`
- `icon` is a key of `ICONS` in `remotion/icons.ts` (react-icons components). Add a key there to use a new icon.
- `Markers = { game, file: "footage.mp4", fps?, shots: Record<string, number>, ends?: Record<string, number>, focus?: Record<string, { x, y, w, h }> }`, seconds into the footage; focus boxes are fractions of the frame. Capture also writes an `end` marker. A segment plays from its shot's marker to `ends[shot]` (else the next marker), then freezes on the last frame if it runs longer.
- `AudioManifest = { voice, source: "higgsfield"|"placeholder", timing: "whisper"|"estimate", lines: { id, file, durationSec, words: { text, startSec, endSec }[] }[], totalSec }`. `words` are the exact script words (punctuation kept) with times in the trimmed clip, and drive the animated captions and the cue cuts. `timing` is `estimate` only for a placeholder run, where words are spread by character count. Line length in the video is `durationSec` plus the gap after it (see Look and cadence).

## Voice

Provider is Higgsfield only, one voice for every game, set in `voice.config.json`: model `seed_audio` (Seed Audio 1.0), preset voice Juno (`a3ce02fe-4d3e-55bc-b4d4-a4801b9acdb4`).

1. Generate one clip per line through the Higgsfield MCP connector (`claude.ai Higgsfield`): `generate_audio_batch` with `model`, `voice_type`, `voice_id` from the config, `format: "wav"`, `sample_rate: 48000`, and the line's exact `text` as `prompt`. The account allows 4 concurrent jobs, so submit in groups of 4 and poll with `jobs_wait`.
2. Download each result to `<game>/audio/raw/<id>.wav`.
3. `npm run voice -- <game>` trims leading and trailing silence from each raw clip (blips under 0.2 s don't count as speech), writes `<game>/audio/<id>.wav`, measures it with ffprobe, gets word timings and writes `audio/manifest.json` with `source: "higgsfield"`, `timing: "whisper"`.

Word timings (`pipeline/words.ts`) come from local whisper.cpp through `@remotion/install-whisper-cpp` (transcription for timing only, not TTS). The first run builds whisper.cpp 1.5.5 and downloads the `small.en` model into `tutorials/.whisper/` (gitignored); it needs `make` and a C++ compiler. Whisper's subword tokens are joined back into words (it splits names like "Kiko" into "K" + "iko"), then the heard words are mapped onto the script words by sequence alignment on normalised tokens (lowercase alphanumerics, digits spelled out); unmatched script words are interpolated between neighbours, starting after any pause that follows the last matched word (whisper sometimes drops a short sentence after a pause). If under 70% of the script words match it throws `clip <id> doesn't match its text`, which catches stale clips. Whisper tends to stamp the last word before a pause at the pause's end, so silencedetect pauses pull such a word back. Expect word times to be good to roughly 0.1 to 0.3 s.

Some but not all raw clips present: error naming the missing ids. None present: placeholder manifest (`file: null`, `durationSec = estimateSec`) and a silent render that still carries an audio track.

## Gitignored

`tutorials/.gitignore`: `node_modules`, `.whisper/`, `<game>/capture/` (footage, markers, screenshots; regenerate with `capture`), `<game>/out/` (MP4, frames), `<game>/audio/*.mp3|wav` and `<game>/audio/raw/`. Committed: `script.md`, `dialogue.json`, `audio/manifest.json`.
