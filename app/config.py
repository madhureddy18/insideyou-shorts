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
    # --- Zack D. Films' own most-viewed Shorts (YouTube, sorted by views; gun/violent ones removed)
    "How Stitches Work",
    "How Splinters Get Unstuck",
    "The Reason The McFlurry Spoon Looks Weird",
    "How Long Are Your Blood Vessels?",
    "An Island Of Toenail Clippings?",
    "Blown Veins",
    "Tootsie Rolls Used In War?",
    "Bone Grafting Explained",
    "Saws That Stop For Fingers",
    "Why Bees Die After They Sting You",
    "What Is The Purpose Of Your Uvula?",
    "How This Expensive Wood Is Made",
    "Stuck In A Water Slide",
    "Why Did People Put Bells On Graves?",
    "How A Derma Roller Works",
    "How Cheating Dice Work",
    "What Is A Skin Tag?",
    "Why There Is No 'E' Grade",
    "Tarantulas Keep Frogs As Pets?",
    "How Strong Is Your Hair?",
    "Why George Washington Never Smiled",
    "How To Remove Cactus Spines",
    "Buried In Manure And Saved By A Goat",
    "Fixing A Chipped Tooth",
    "How A Fly-Powered Plane Works",
    "The Fake $100 Made From A Real $1",
    "Why Using Q-Tips Feels So Good",
    "How The Equals Sign Was Invented",
    "The Boy With The Empty Pot",
    "Octopus Limb Regrowth",
    "Can Seeds Really Sprout Inside You?",
    "Trapped On A Trapeze In The Sky",
    "How Strong Are Human Bones?",
    "How Gas Pumps Know When To Stop",
    "Using Ants To Stitch Wounds",
    "Who's In Control Of Big Bird?",
    "Can You Outrun Night Forever?",
    "Swallowing Down The Wrong Pipe",
    "Whale Vomit Is Worth Millions",
    "Fingernails Never Stop Growing",
    "The Pinocchio Nose Paradox",
    "This Creature Can Regrow Its Limbs",
    "The Skittles Lie That Tricked Us All",
    "Why Soda Tabs Have That Hole",
    "Parasite Replaces A Fish's Tongue",
    "Stanley Cup Saves Life",
    "Why You Always See A Trash Can At Disney",
    "How Eyewash Stations Work",
    "What Is An Ingrown Hair?",
    "Trapped In A Room With Closing Walls",
    "Swallowed By A Sperm Whale?!",
    "The Best Way To Cut A Watermelon",
    "How Beethoven Heard Music While Deaf",
    "How Many Earths Fit Inside The Sun?",
    "Lego Stuck In Nose For 26 Years",
    "How To Properly Remove Ear Wax",
    "How An Ant Actually Stings you",
    "What Would You See With No Eyes?",
    "The Strongest Muscle In Your Body",
    "The Inside Of Kit Kats Are NOT What You Think",
    "Growing An Ear In Your Arm",
    "The Trick That Safely Picks Up Broken Glass",
    "Saved By Belly Fat",
    "He Built A Prosthetic Arm With Lego",
    "The Prison Key Cake Escape",
    "Gordon Ramsay's Trick To Perfect Eggs",
    "Punched Into A Math Genius",
    "Should You Pop Your Blisters?",
    "How These Energy Saving Stairs Work",
    "How Magicians Saw People In Half",
    "Some Snakes Eat Themselves",
    "How Blackhead Extraction Works",
    "Dropping An Ant Off The Empire State Building",
    "How We Ruined Pugs",
    "Teddy Roosevelt Saved By A Speech",
    "How A Snake Swallows BIG Animals",
    "Flying A Plane With No Pilot",
    "How Electrical Outlets Work",
    "How Hearing Works",
    "How Skin Grafts Work",
    "Why Birds Swallow Rocks After Eating",
    "How To Make A Strong Hammer Out Of Ice",
    "How Laser Hair Removal Works",
    "How Dreadlocks Form",
    "What Is A Root Canal?",
    "Does Shaved Hair Grow Back Thicker?",
    "Tooth Drilling Before Anesthesia",
    "How She Spoke Without Sight Or Sound",
    "Why Pills Are Taken Under The Tongue",
    "What To Do If You Fall Through Ice?",
    "How To Survive In A Sewer",
    "How To Noodle A Catfish",
    "Could Humans Huddle For Warmth Like Penguins?",
    "Common Burn Treatment Myths",
    "Why Our Ancestors Didn't Need To Brush Their Teeth",
    "Toucan Gets A Custom Artificial Beak",
    "How Freeze-Drying Pets Works",
    "The Surgery To Become Taller",
    "He Fell Asleep On The Train Tracks",
    "Tham Luang Cave Rescue",
    "Dropping A Basketball From A Skyscraper",
    "Rescued By A Beluga Whale",
    "Roller Coaster Without A Harness?",
    "How To Spin Your Head Like An Owl",
    "What Happens When A Military Dog Breaks A Tooth",
    "Skateboarding Down The Hoover Dam",
    "How The Eyes On Mount Rushmore Were Carved",
    "Does Gum Stay In Your Stomach For 7 Years?",
    "Stacking Humans To Build Great Wall Of China",
    "How Ant Colonies Evacuate During Floods",
    "How Far Can Your Tongue Stretch?",
    "He Hid In The Jungle For 30 Years",
    "How Medieval Armor Protected Knights",
    "How To Make The Best S'more",
    "He Used Water Filled Tubes To Block A Flood",
    "How An Anteater's Tongue Works",
    "Magic Trick Explained (Quarter Bite Trick)",
    "How Cookiecutter Sharks Bite Whales",
    "Origin Of The Mad Hatter",
    "Swallowing A Tooth?!",
    "The Swedish Coffee Experiment",
    "How A Lung Tester Prank Works",
    "Did Aliens Cut This Rock In Half?",
    "How Cast Saws Don't Hurt Your Skin",
    "Escaping A Grain Bin",
    "The Man Who Was Both A Dwarf And A Giant",
    "Why Royal Guards Wear Their Straps Above The Chin",
    "How To Trick Old Vending Machines",
    "Can You Die From Drinking Too Much Water?",
    "AI Thought He Was Falling Asleep",
    "McDonald's Scalding Hot Coffee",
    "What To Do If Power Lines Fall On Your Car",
    "The Hero War Dog",
    "How Too Much Caffeine Can Kill You",
    "How Wax Hair Removal Works",
    "What To Do If You're Lost In A Cave",
    "This Magic Trick Explained (levitation)",
    "The Autistic Inmate Who Outsmarted Guards",
    "How Do Oysters Make Pearls?",
    "Earthquake Beds (Explained)",
    "Fish Pedicures",
    "The Iceberg That Sank The Titanic",
    "Could You Make A Lava Lamp Out Of Lava?",
    "The Great Escape Of Henry Box Brown",
    "How Suction Splinter Removal Works",
    "How The McFlurry Spoon Works",
    "How A Lemon Battery Works",
    "Catfish Tricks Another Fish Into Adoption",
    "How Chainsaw Kickback Works",
    "How To Catch A Baboon",
    "Swept Through A Drain Pipe",
    "What Is An Ingrown Toenail?",
    "Girl Raised By Dogs",
    "This Magic Trick Explained (sword-swallowing)",
    "How A Fan Warned A Man About Cancer",
    "Would A Tiger-Sized Kitten Kill You?",
    "Rescued Penguin Returns Every Year",
    "Can A Seed Grow In Your Nose?",
    "Infinite Chocolate Trick Explained",
    "Why Elephants Never Escape",
    "How Much Gasoline Is Spilled Each Day?",
    "How Eye Transplants Work",
    "This is why the Titanic is Disappearing",
    "Eagle Gets A 3D Printed Beak",
    "Woman Lives In A Tree",
    "Why You Shouldn't Peel Your Hangnails",
    "How Fossilization Works",
    "What Is A Blood Blister?",
    "She Found A 1500 Year Old Sword In A Lake",
    "Gorilla Reunites With Friend After 5 Years",
    "Why You Should Check Your Ears For Bugs",
    "Can A Moth Remember Its Life As A Caterpillar",
    "How An Inhaler Works",
    "Why You Can't Smile In Passports",
    "What Would Happen If You Were Swallowed By A Whale?",
    "His Gas Pedal Was Stuck",
    "Surviving A Fall Off A Cruise Ship",
    "Why Pore Strips Can Be Bad",
    "Pulling The Emergency Door On A Plane",
    "How To Escape A Car Trunk",
    "Why Ninjas Walk Like Rabbits",
    "How Guards Discovered A Hidden Ninja",
    "Don't Declaw Your Cat",
    "How To Unlock A Door With A Hairpin",
    "How To Get Out Of Handcuffs",
    "Baseball Star Caught With A Corked Bat",
]
