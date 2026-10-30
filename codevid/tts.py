"""Free, offline character voices with Kokoro (Apache-2.0) via sherpa-onnx.

    pip install sherpa-onnx soundfile
    # model (~350 MB, once): https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2
    python tts.py lines.json out_dir          # lines.json: [{"who": "raju", "text": "..."}, ...]

Writes out_dir/01.wav, 02.wav ... and prints a JSON list of durations (seconds).
"""
import json
import os
import sys

MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.join(os.path.dirname(__file__), "models", "kokoro-multi-lang-v1_0"))

# character -> (Kokoro speaker id, speed). IDs from the model's own speaker table.
VOICES = {
    "raju": (18, 1.08),      # am_puck  - bright, energetic, curious
    "bloc": (16, 0.98),      # am_michael - calm, warm, confident
    "narrator": (16, 1.0),
}


def engine():
    import sherpa_onnx
    d = MODEL_DIR
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
                data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict",
                lexicon=f"{d}/lexicon-us-en.txt,{d}/lexicon-zh.txt"),
            num_threads=max(1, (os.cpu_count() or 2))),
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg)


def main(lines_file, out_dir):
    import soundfile as sf
    lines = json.load(open(lines_file))
    os.makedirs(out_dir, exist_ok=True)
    tts = engine()
    durs = []
    for i, line in enumerate(lines, 1):
        sid, speed = VOICES.get(line.get("who", "narrator"), VOICES["narrator"])
        audio = tts.generate(line.get("say") or line["text"], sid=line.get("sid", sid), speed=line.get("speed", speed))
        path = os.path.join(out_dir, f"{i:02d}.wav")
        sf.write(path, audio.samples, audio.sample_rate)
        durs.append(round(len(audio.samples) / audio.sample_rate, 3))
    print(json.dumps(durs))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
