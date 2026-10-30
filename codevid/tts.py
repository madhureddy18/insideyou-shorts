"""Free, offline character voices with Kokoro (Apache-2.0) via sherpa-onnx.

    pip install sherpa-onnx soundfile espeakng-loader phonemizer-fork
    # model (~350 MB, once): https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2
    python tts.py lines.json out_dir          # lines.json: [{"who": "maddie", "text": "..."}, ...]

Writes out_dir/01.wav, 02.wav ... and prints a JSON list of durations (seconds).
Words missing from Kokoro's dictionary (names like Maddie/Chotu, plurals like "rupees") are phonemized with
espeak-ng and added to an extra dictionary, so no word is ever silently skipped.
"""
import json
import os
import re
import sys

MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.join(os.path.dirname(__file__), "models", "kokoro-multi-lang-v1_0"))

# character -> (Kokoro speaker id, speed). IDs from the model's own speaker table.
VOICES = {
    "maddie": (18, 1.08),    # am_puck    - bright, energetic, curious
    "chotu": (16, 1.0),      # am_michael - warm, confident explainer
    "narrator": (16, 1.0),
    "speaker": (33, 0.95),   # Hindi female voice for the payment soundbox
    "raju": (18, 1.08), "bloc": (16, 0.98),
}
# exact pronunciations for our names / Indian words (Kokoro phoneme symbols, space separated)
CUSTOM = {
    "maddie": "m ˈ æ d i", "chotu": "ʧ ˈ O t u", "chotus": "ʧ ˈ O t u z", "lakh": "l ˈ ɑ k", "lakhs": "l ˈ ɑ k s",
    "crore": "k ɹ ˈ O ɹ", "crores": "k ɹ ˈ O ɹ z", "paisa": "p ˈ I s ə", "rupees": "ɹ u p ˈ i z", "wala": "w ˈ ɑ l ə", "wala's": "w ˈ ɑ l ə z", "chai": "ʧ ˈ I",
}
ESPEAK_MAP = [("aɪ", "I"), ("aʊ", "W"), ("eɪ", "A"), ("ɔɪ", "Y"), ("oʊ", "O"), ("əʊ", "O"), ("tʃ", "ʧ"), ("dʒ", "ʤ"),
              ("ɚ", "əɹ"), ("ɝ", "ɜɹ"), ("ɾ", "T"), ("ɐ", "ə"), ("ᵻ", "ɪ"), ("r", "ɹ"), ("ː", ""), ("ʔ", ""), ("̩", "")]


def _lexicon_words(path):
    words = set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            w = line.split(" ", 1)[0]
            if w:
                words.add(w.lower())
    return words


def _espeak():
    try:
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper
        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from phonemizer.backend import EspeakBackend
        return EspeakBackend("en-us", preserve_punctuation=False, with_stress=True, tie=False, language_switch="remove-flags")
    except Exception as e:                                   # pragma: no cover
        print("espeak not available, unknown words may be skipped:", e, file=sys.stderr)
        return None


def extra_lexicon(texts, out_path):
    d = MODEL_DIR
    known = _lexicon_words(f"{d}/lexicon-us-en.txt")
    tokens = {l.split(" ")[0] for l in open(f"{d}/tokens.txt", encoding="utf-8") if l.strip()}
    need = set()
    for t in texts:
        for w in re.findall(r"[A-Za-z][A-Za-z']*", t):
            if w.lower() not in known or w.lower() in CUSTOM:
                need.add(w.lower())
    entries, esp = [], None
    for w in sorted(need):
        if w in CUSTOM:
            ph = CUSTOM[w]
        else:
            esp = esp or _espeak()
            if not esp:
                continue
            s = esp.phonemize([w])[0].strip()
            for a, b in ESPEAK_MAP:
                s = s.replace(a, b)
            ph = " ".join(ch for ch in s if ch in tokens and ch != " ")
        if ph:
            entries.append(f"{w} {ph}")
            if w.capitalize() != w:
                entries.append(f"{w.capitalize()} {ph}")
            entries.append(f"{w.upper()} {ph}")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(entries) + "\n")
    return out_path


def engine(extra=None):
    import sherpa_onnx
    d = MODEL_DIR
    lex = ",".join(x for x in [extra, f"{d}/lexicon-us-en.txt", f"{d}/lexicon-zh.txt"] if x)
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
                data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict", lexicon=lex),
            num_threads=max(1, (os.cpu_count() or 2))),
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg)


def main(lines_file, out_dir):
    import soundfile as sf
    lines = json.load(open(lines_file))
    os.makedirs(out_dir, exist_ok=True)
    extra = extra_lexicon([l.get("say") or l["text"] for l in lines], os.path.join(out_dir, "extra_lexicon.txt"))
    tts = engine(extra)
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
