"""Brand + model configuration for the InsideYou Studio app."""
import os

PROJECT = os.environ.get("PROJECT_ID", "katha-tv-512618")
TEXT_MODEL_ID = os.environ.get("TEXT_MODEL_ID", "gemini-3.8-flash")
IMAGE_MODEL_ID = os.environ.get("IMAGE_MODEL_ID", "gemini-nano-banana-2.1")
VIDEO_MODEL_ID = os.environ.get("VIDEO_MODEL_ID", "gemini-omni-1.1-flash-preview")
VOICE = os.environ.get("VOICE", 'en-US-AndrewNeural')
VOICE_RATE = os.environ.get("VOICE_RATE", '+8%')
VIDEO_WORKERS = int(os.environ.get("VIDEO_WORKERS", "3"))
RS_PER_ANIMATED_SHOT = 55      # rough cost of one ~6s Omni clip at 720p (for estimates before running)
RS_BASE = 10                   # script + images + voice

# Metered costs used by the credit tracker (approximate list prices, in rupees)
RS_TEXT = 0.5                  # one Gemini text call (script / fact-check)
RS_IMAGE = 3.5                 # one Nano Banana image
RS_VIDEO_PER_S = 8.5           # one second of Gemini Omni 720p video
RS_TTS_PER_1K = 1.5            # 1,000 characters of Gemini TTS
CREDITS_START_RS = float(os.environ.get("CREDITS_START_RS", "28757"))

# Narrator voices. "gemini:<Name>" = Google Gemini TTS (natural), "edge:<voice>" = free Microsoft voice
TTS_MODEL = os.environ.get("TTS_MODEL", "gemini-2.5-flash-tts")
TTS_RATE = float(os.environ.get("TTS_RATE", "1.1"))   # narration pace (1.0 = normal); Shorts like it brisk
VOICES = [
    ("gemini:Charon", "Charon - deep, calm male (recommended)"),
    ("gemini:Puck", "Puck - upbeat, energetic male"),
    ("gemini:Orus", "Orus - firm, confident male"),
    ("gemini:Kore", "Kore - clear, confident female"),
    ("gemini:Aoede", "Aoede - warm, friendly female"),
    ("edge:en-US-AndrewNeural", "Andrew - free voice (lower quality)"),
]
DEFAULT_VOICE = os.environ.get("DEFAULT_VOICE", "gemini:Charon")

BRAND_TEXT = os.environ.get("BRAND_TEXT", "VERSE FILMS")          # printed inside scenes (shirt, signs, labels)
WATERMARK_TEXT = os.environ.get("WATERMARK_TEXT", "VERSE FILMS")  # small corner watermark on every video
END_CARD = os.environ.get("END_CARD", "FOLLOW FOR MORE")            # button shown over the last ~2 seconds ("" = off)
END_CARD_SUB = os.environ.get("END_CARD_SUB", BRAND_TEXT)            # small line above the button
MAX_BRAND_OBJECTS = 2                                                # "VERSE FILMS" on objects in at most this many shots
HERO_FACE_KEY = "brand/hero_face_v1.png"
HERO_DESC_KEY = "brand/hero_face.json"     # {"description": ...} written when you upload your own face      # saved once: the mascot's face/hair reference, reused forever

# The mascot's permanent look. His OUTFIT is chosen per video to fit the story (like real life).
HERO_FACE = ("a friendly young man in his mid-20s with short wavy dark-brown hair, light stubble, warm brown "
             "eyes, slim athletic build")
DEFAULT_OUTFIT = f'a mustard-yellow crew-neck t-shirt with "{BRAND_TEXT}" printed small across the chest, and dark jeans'
BRAND_CHARACTER = HERO_FACE + ", wearing " + DEFAULT_OUTFIT

STYLE = 'Clean stylized 3D render, smooth glossy materials, soft studio lighting, subtle rim light, shallow depth of field, cinematic medical-explainer look, simple uncluttered background, vibrant but realistic colors, high detail, vertical 9:16 composition, subject centered, no captions or random text (only the brand name where it is specified), no watermark, any person is fully clothed, family-friendly'

# Visual looks. "bright" = clean, toy-like studio 3D like top 3D explainer channels; "cinematic" = the original look.
STYLE_BRIGHT = ("Bright clean stylized 3D render like a high-end 3D explainer short: glossy plastic, clay and chrome "
                "materials, saturated colors (royal blue, cyan, chrome, warm orange, neon magenta accents), bright "
                "sky-blue or soft pastel studio backdrop, high-key soft lighting with gentle shadows, crisp details, "
                "shallow depth of field, extreme close-up or macro framing, vertical 9:16 composition, no captions "
                "or random text (only the brand name where it is specified), no watermark, any person is fully "
                "clothed, family-friendly")
LOOKS = {
    "bright": {"label": "Studio bright (Zack-style)", "style": STYLE_BRIGHT, "shots": 10, "captions": "clean",
               "hook_title": False},
    "cinematic": {"label": "Cinematic (darker, realistic)", "style": STYLE, "shots": 7, "captions": "pop",
                  "hook_title": True},
}
DEFAULT_LOOK = os.environ.get("DEFAULT_LOOK", "bright")


def look(name):
    return LOOKS.get(name or DEFAULT_LOOK, LOOKS[DEFAULT_LOOK])


TOPIC_BANK = [
    # --- body: what happens if
    'What happens if you swallow chewing gum',
    'What happens if you hold in a sneeze',
    'What happens to your body if you stay awake for 3 days',
    'What happens if you crack an egg in space',
    "What happens if you drink sea water when you're stranded",
    'What happens to your brain when you get brain freeze',
    'What happens inside your mouth when you eat something super spicy',
    'What happens if a mosquito bites you',
    'What happens when a bee stings you',
    'What happens to your ears on an airplane',
    'What happens to your eyes when you stare at your phone in the dark',
    'What happens when you get goosebumps',
    # --- body: how it works
    'How a dentist fills a cavity',
    'How braces slowly move your teeth',
    'How a broken bone heals itself',
    'How a kidney stone forms and gets out',
    'How LASIK reshapes your eye with a laser',
    'How your stomach digests a whole pizza',
    'Why you get hiccups and how they stop',
    'How a cut on your finger closes up',
    # --- survival
    'How to escape a car sinking in water',
    'How to survive quicksand',
    'How to escape a rip current at the beach',
    'What to do if an elevator starts falling',
    'How to survive if you get lost in the desert',
    'How to survive falling through ice on a frozen lake',
    'What to do if lightning strikes near you',
    'How to survive being buried in an avalanche',
    # --- if you do this every day
    'What happens if you sleep on the same side every night for years',
    'What happens if you crack your neck every day',
    'What happens to your teeth if you drink soda every day',
    'What happens if you sit for 10 hours a day for 20 years',
    'What happens if you wear headphones at full volume every day',
    'What happens if you never stretch for years',
    # --- how everyday things secretly work
    'How a vending machine knows your coin is fake',
    'Why airplane windows are round',
    'How an airplane toilet flushes',
    'How a self-checkout scale catches you',
    'How traffic lights know a car is waiting',
    'How a smoke detector smells smoke',
    'Why your phone gets hot when it charges fast',
    'How a parking sensor sees behind your car',
    'How a QR code stores information',
    'How noise-cancelling headphones delete sound',
    # --- behind the scenes
    'How astronauts sleep in space',
    'How astronauts go to the bathroom in space',
    'How deep sea divers avoid the bends',
    'How a cruise ship makes fresh water from the ocean',
    'How a skyscraper survives an earthquake',
    'How a submarine dives and comes back up',
    # --- animals and nature
    'How a chameleon changes color',
    'How a mosquito finds you in the dark',
    'How an octopus thinks with its arms',
    'How a woodpecker hits wood without a headache',
    'How frogs survive being frozen solid',
    # --- giant what ifs
    'What would happen if Earth stopped spinning for one second',
    'What would happen if the Moon disappeared',
    'What would happen if you fell into a black hole',
    'What would happen if you dug a hole through the Earth and jumped in',
    'What would happen if you were the size of an ant',
]
