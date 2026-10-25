# InsideYou Shorts

Zack D-style 3D explainer Shorts generator: Gemini script + fact-check, Nano Banana images with a consistent cast,
Gemini Omni image-to-video, narration, word-by-word captions, hook title, sound design, -14 LUFS.

- `make_short.py`: the whole pipeline. The Kaggle notebook downloads and runs this file on every run.
- `insideyou_shorts.ipynb`: the slim Kaggle notebook (settings + loader). Import once.

Kaggle secrets: `VERTEX_API_KEY`, `GCP_SA_KEY`, `GITHUB_TOKEN` (fine-grained, Contents read-only on this repo),
optional `KAGGLE_USERNAME` + `KAGGLE_KEY` for permanent brand files.
