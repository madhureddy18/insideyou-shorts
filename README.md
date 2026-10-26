# InsideYou Shorts

Zack D-style 3D explainer Shorts generator: Gemini script + fact-check, Nano Banana images with a consistent cast,
Gemini Omni image-to-video, narration, word-by-word captions, hook title, sound design, -14 LUFS.

- `make_short.py`: the whole pipeline. The Kaggle notebook downloads and runs this file on every run.
- `insideyou_shorts.ipynb`: the slim Kaggle notebook (settings + loader). Import once.

Kaggle secrets: `VERTEX_API_KEY`, `GCP_SA_KEY`, `GITHUB_TOKEN` (fine-grained, Contents read-only on this repo),
optional `KAGGLE_USERNAME` + `KAGGLE_KEY` for permanent brand files.

## InsideYou Studio (web app)

A phone-friendly app for the same pipeline, running on Cloud Run in your GCP project:
pick a topic → review/edit the script → review images (tap to redo) → animate → download.
Heavy steps run as Cloud Run Job executions, so you can close the page while it works.
No API keys or JSON key files: the app's own service account talks to Gemini.

**Deploy / update** (in Google Cloud Shell):
```
git clone https://github.com/madhureddy18/insideyou-shorts && cd insideyou-shorts
bash deploy.sh
```
Re-run `git pull && bash deploy.sh` to update.

Local test without spending credits: `FAKE_AI=1 APP_PASSWORD=test uvicorn app.main:app --port 8080`

## Credits
Title-scoring rules in `app/seo.py` are adapted from [youtube-agent-skill](https://github.com/Jakeschincariol/youtube-agent-skill) by Jake Schincariol (MIT License).
