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
    # --- How X works
    "How stitches close a deep cut",
    "How a tooth implant is screwed into your jaw",
    "How a hair transplant moves hair from the back of your head",
    "How laser tattoo removal breaks the ink",
    "How a root canal saves a dying tooth",
    "How a cast heals a broken arm",
    "How doctors remove a kidney stone with sound waves",
    "How your body makes a scab",
    "How a cochlear implant lets deaf people hear",
    "How doctors restart a heart with a defibrillator",
    "How your body fights off a cold",
    "How a filling stops a cavity from spreading",
    # --- Why you should never
    "Why you should never pop a pimple in the danger triangle of your face",
    "Why you should never put cotton swabs in your ears",
    "Why you should never sleep with your phone under your pillow",
    "Why you should never hold in a sneeze",
    "Why you should never wake up a sleepwalker suddenly",
    "Why you should never drink water from a garden hose left in the sun",
    "Why you should never touch a downed power line",
    "Why you should never put a hot pan in cold water",
    "Why you should never sit in a parked car on a hot day",
    "Why you should never swim right after a thunderstorm starts",
    "Why you should never charge your phone in the bathroom",
    "Why you should never microwave a boiled egg",
    # --- Weird body facts
    "What happens if you swallow chewing gum",
    "What happens to your body if you never brush your teeth",
    "What happens when you get an ingrown toenail",
    "Why your fingers get wrinkly in water",
    "What happens to your body when you get lightning struck",
    "What happens inside your body when you get food poisoning",
    "Why you feel like you are falling when you fall asleep",
    "What happens to your body if you stay awake for 11 days",
    "What happens if you never cut your nails",
    "Why your stomach growls when you are hungry",
    # --- Bizarre history
    "Cleveland Balloonfest 1986: 1.5 million balloons gone wrong",
    "The Great Molasses Flood of 1919",
    "The London Beer Flood of 1814",
    "The Dancing Plague of 1518",
    "The Great Emu War of Australia",
    "The town that has been on fire underground since 1962 (Centralia)",
    "The man who survived two atomic bombs",
    "The 1904 Olympic marathon, the strangest race ever",
    "The Great Stink of London 1858",
    "How a single typo crashed a NASA rocket in 1962",
    # --- Brand stories
    "Pepsi Number Fever: the bottle cap contest that went wrong",
    "The kid who sued Pepsi for a fighter jet",
    "The story behind the Starbucks logo",
    "The Flamin Hot Cheetos origin story (explained)",
    "New Coke: Coca-Cola's biggest mistake",
    "How Blockbuster laughed at Netflix and lost everything",
    "Kodak invented the digital camera and hid it",
    "Why McDonald's ice cream machines are always broken",
    "How Nokia went from number one to almost nothing",
    "The Ford Edsel: a billion dollar flop",
    "Why Pringles are called potato crisps, not chips",
    "The real reason Toblerone changed its logo",
    # --- Secretly works like this
    "How a vending machine knows your coin is fake",
    "Why airplane windows are round",
    "How fish get into lakes that were never connected to anything",
    "How a self-checkout knows you didn't scan something",
    "How a lie detector test actually works",
    "How to catch a liar with three simple tricks",
    "Why cats always land on their feet",
    "How a casino knows you are counting cards",
    "Why hotel rooms have a Bible in the drawer",
    "Why the elevator door close button often does nothing",
    # --- Survival
    "How to escape a car sinking in water",
    "How to survive quicksand",
    "How to escape a rip current",
    "What to do if you are trapped in a falling elevator",
    "How to survive if you fall through ice",
    "How to survive being lost at sea",
    "What to do if a bear finds you in the woods",
    "How to survive an avalanche",
    # --- Animals and nature
    "Why you should never pick up a cone snail",
    "How a botfly lays eggs using a mosquito",
    "The candiru, the tiny fish people fear in the Amazon",
    "How a pistol shrimp punches with a bubble hotter than the sun",
    "Why flamingos are pink",
    "How a cuckoo bird tricks other birds into raising its babies",
    "The frog that freezes solid and comes back to life",
    "Why mosquitoes bite some people more than others",
    # --- Clever stories
    "How three prisoners escaped Alcatraz with spoons and paper heads",
    "The man who sold the Eiffel Tower twice",
    "The thief who stole the Mona Lisa and kept it under his bed",
    "The fake restaurant that became number one on TripAdvisor",
    "The man who lived in an airport for 18 years",
    "The teenager who hacked NASA from his bedroom",
]
