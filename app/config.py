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
TTS_STYLE = ("Read this like a calm, confident, fast-paced science explainer narrator for a viral short video. "
             "Clear, warm and engaging, with natural emphasis and short pauses between sentences.")
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
HERO_FACE_KEY = "brand/hero_face_v1.png"
HERO_DESC_KEY = "brand/hero_face.json"     # {"description": ...} written when you upload your own face      # saved once: the mascot's face/hair reference, reused forever

# The mascot's permanent look. His OUTFIT is chosen per video to fit the story (like real life).
HERO_FACE = ("a friendly young man in his mid-20s with short wavy dark-brown hair, light stubble, warm brown "
             "eyes, slim athletic build")
DEFAULT_OUTFIT = f'a mustard-yellow crew-neck t-shirt with "{BRAND_TEXT}" printed small across the chest, and dark jeans'
BRAND_CHARACTER = HERO_FACE + ", wearing " + DEFAULT_OUTFIT

STYLE = 'Clean stylized 3D render, smooth glossy materials, soft studio lighting, subtle rim light, shallow depth of field, cinematic medical-explainer look, simple uncluttered background, vibrant but realistic colors, high detail, vertical 9:16 composition, subject centered, no captions or random text (only the brand name where it is specified), no watermark, any person is fully clothed, family-friendly'

TOPIC_BANK = [
    'What happens inside your body when you hold in a sneeze',
    'Why your fingers get wrinkly in water',
    'What happens to your body when you stay awake for 3 days',
    'What happens inside your mouth when you eat something sour',
    'Why you get brain freeze from cold drinks',
    'What actually happens when you crack your knuckles',
    'What happens to your body when you jump into ice-cold water',
    "Why your stomach growls when you're hungry",
    'What happens inside your ear when you hear a loud bang',
    'What happens to your body when you hold your breath as long as you can',
    'Why you get goosebumps',
    'What happens to your eyes when you stare at your phone in the dark',
    'Why your leg falls asleep',
    'What happens inside your nose when you have a blocked nose',
    'What happens to your body when you drink too much water',
    'What caffeine actually does inside your brain',
    'What happens to a bruise as it heals',
    'Why you hiccup and how it stops',
    'What happens to your muscles after a hard workout',
    'What happens inside your body when you get a fever',
    'How your body heals a small cut',
    'What happens to your body when you skip breakfast',
    'Why your voice sounds different on a recording',
    'What happens to your teeth when you drink soda every day',
    'Why you yawn when you see someone else yawn',
    "What happens to your brain when you're about to fall asleep and feel like you're falling",
    'What happens to your body during a long-haul flight',
    'Why spicy food makes you sweat',
    'What happens if you fall into quicksand and how to escape',
    'What happens if you fall through ice into a frozen lake',
    'What happens to your body in space without a spacesuit',
    'What to do if your car goes into water',
    'What happens if you get struck by lightning',
    'How to survive a rip current at the beach',
    'What happens to your body at the top of Mount Everest',
    'What happens if an elevator cable snaps',
    'What happens to your body in extreme desert heat',
    'What happens if you swallow chewing gum',
    'How to survive if you get lost in a forest at night',
    'What happens to your body at the bottom of the ocean',
    'What happens if you get stung by a jellyfish',
    'What happens if you eat a ghost pepper',
    'How a vaccine teaches your body to fight a virus',
    'How an X-ray sees inside your body',
    'How a pacemaker keeps a heart beating',
    'How dental braces actually move your teeth',
    'How contact lenses fix your vision',
    'How a hearing aid works inside your ear',
    'How anesthesia puts you to sleep before surgery',
    'How a seatbelt saves you in a crash',
]
