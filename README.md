# MiC Scene Editor

Write Medicine in Context animations as plain-text scenes and watch them play, in the browser (tablet first).

**Open it:** https://kingachvic.github.io/mic-editor/

- The language, the engine and the editor's source live in the private repo `paper-remotion`
  (`src/mic/`, `editor/`). This repo only holds the built site: rebuild with `sh editor/build.sh` there and copy
  `editor/dist/*` here.
- Your scene is saved in the browser automatically. Download (or copy) it as a `.mic` file to keep it and to render it on Kaggle.
- The Help tab is the full cheat sheet.

## Rendering on Kaggle

`render/` is the render package (the engine pre-bundled, fonts, paper, a tiny Remotion project).
Use `render/mic-render-kaggle.ipynb`: import it into Kaggle, attach a private dataset with your `.mic` files
(and `voice_timings.json` once you've recorded), Internet on, Save & Run All. One MP4 per beat lands in the Output tab.
