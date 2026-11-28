---
name: gamespaglu-tut-videos
description: Make or remake a game's tutorial video (the 9:16 "how to play" short) with the `tutorials/` pipeline. Use when asked for a tutorial video, its script or narration, or a fix to one.
---

# Gamespaglu tutorial videos

The pipeline's mechanics (stages, schemas, capture, Higgsfield voice, whisper timing) live in `tutorials/README.md`. Read it first. This skill holds what the video should be. Where the pipeline can't yet do something below, extend the pipeline, so every game gets it.

## Steps

1. **Learn the game from its code**: `src/lib/<game>/`, `src/components/<game>/` and its entry in `src/content/guides.ts`. List every rule, mode and win condition the code enforces. Done when each fact in the script traces to a line of code.
2. **Write the story**: `tutorials/<game>/script.md` and `dialogue.json`, following [Script](#script). Done when every line reads as something happening at a table.
3. **Plan the screen**: give each line its shot, cues, zooms and any graphic, following [Screen](#screen). Done when every rule worth showing has a moment on the real UI.
4. **Capture, voice, render** as `tutorials/README.md` describes.
5. **Check the frames** (`npm run frames -- <game>`) against every rule in this skill, one by one. Fix and re-render until all of them hold. Then run typecheck and lint.
6. **Ship it.** Rohosen uploads to YouTube. Add the id as `video` on the game's guide in `src/content/guides.ts`; the site shows it from there.

## Script

- **Narrative voice.** Follow one table playing through a round. Named players act, the narration says what they do, and the rules come out of the action.
  - Instructive: "The Psychic presses and holds the dial to peek at the target."
  - Narrative: "Asha holds the dial. Only she sees where the target hides."
- **The game stands on its own.** Open on what makes this game fun, in its first line. Every line is about this game. Site-wide traits (accounts, signal, rooms, the phone) appear only when they change how this game plays.
- **Every mode gets its own beat**: a short scene of that mode being played, with the screen showing that mode.

## Screen

- **Real UI only.** Every frame is footage captured from the running app. Explanations sit on top as overlays.
- **Zoom to focus.** When a line is about one part of the screen (the dial, a score, a button), ease in to that part and ease back out. Smooth eased motion, never a hard cut in scale.
- **Graphics explain rules** that footage can't show on its own (scoring bands, win conditions): an animated overlay card over the dimmed footage, in the game's palette.
- **Captions** animate the spoken words, highlighting each as it's said. Small, one line, on a translucent plate, placed clear of the part of the screen the line is about.

## Cadence

Fast. Lines about the same subject run tight, back to back. When the subject changes (a new section, a new mode), take a brief pause, then go on. The gap between two lines follows that one test: same subject, tight; new subject, a beat.
