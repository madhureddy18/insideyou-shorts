"""SEO pack for each Short: target searches, 10 scored titles, search-first description, tags, hashtags,
Instagram caption. Title rules adapted from title.py in Jake Schincariol's youtube-agent-skill (MIT License,
Copyright (c) 2026 Jake Schincariol, github.com/Jakeschincariol/youtube-agent-skill)."""
import json
import re

DESKTOP, MOBILE, HARD = 60, 40, 100
VAGUE = {"amazing", "incredible", "insane", "crazy", "huge", "massive", "ultimate", "best", "powerful",
         "secret", "revolutionary", "mindblowing", "epic", "perfect", "complete", "everything"}
STOP = {"the", "a", "an", "of", "for", "to", "in", "on", "and", "or", "is", "are", "with", "your", "you", "my", "i",
        "this", "that", "it", "how", "what", "why", "when", "if", "does", "do", "happens"}


def words(t):
    return re.findall(r"[a-z0-9']+", (t or "").lower())


def check_title(title, thumb=None):
    """Score a title 0-100 and list concrete issues (length cuts, shouting, vague words, front-loading)."""
    t = title.strip()
    n = len(t)
    issues, good = [], []
    if n > HARD:
        issues.append(f"{n} characters - YouTube's hard limit is {HARD}")
    elif n > DESKTOP:
        issues.append(f"{n} characters - desktop search cuts near {DESKTOP}")
    else:
        good.append(f"{n} characters, fits desktop search")
    if n > MOBILE:
        head = t[:MOBILE].rsplit(" ", 1)[0]
        issues.append(f'mobile feed shows about "{head}..." - check the subject survives')
    caps = [w for w in t.split() if len(w) > 2 and w.isupper()]
    if len(caps) > 2:
        issues.append(f"{len(caps)} all-caps words - two is the ceiling before it reads as spam")
    v = sorted({w for w in words(t) if w in VAGUE})
    for w in v:                                          # each hype word costs on its own
        issues.append(f'vague word "{w}" - swap for a number, a name or a specific')
    nums = re.findall(r"\d[\d,.]*%?", t)
    if nums:
        good.append(f"concrete number ({', '.join(nums[:2])})")
    if t.endswith("?"):
        good.append("open question")
    question = words(t)[:1] and words(t)[0] in {"why", "what", "how", "is", "can", "does", "do", "when"}
    if not question and not [w for w in words(t)[:3] if w not in STOP]:
        issues.append("first three words are filler - move the subject forward")
    if thumb:
        shared = (set(words(t)) - STOP) & (set(words(thumb)) - STOP)
        if len(shared) >= 2:                             # sharing the subject word is fine; echoing the hook is not
            issues.append(f"on-screen hook repeats the title ({', '.join(sorted(shared))})")
        else:
            good.append("hook text and title say different things")
    score = max(0, min(100, 100 - 14 * len(issues) + 4 * len(good)))
    return {"title": t, "chars": n, "score": score, "issues": issues, "good": good}


def query_check(title, description, queries):
    """Do the title + first two description lines contain the words of each target search?"""
    head = " ".join([title] + (description or "").splitlines()[:2]).lower()
    have = set(words(head))
    out = []
    for q in queries:
        key = [w for w in words(q) if w not in STOP]
        missing = [w for w in key if w not in have and w.rstrip("s") not in have and w + "s" not in have]
        out.append({"query": q, "ok": not missing, "missing": missing})
    return out


def seo_prompt(sc):
    narration = " ".join(s["narration"] for s in sc["shots"])
    return f"""You are a YouTube Shorts + Instagram Reels SEO specialist for a 3D science explainer channel
called "Verse Films" (curious "what happens if" / how-your-body-works videos, 30-60 seconds).

VIDEO NARRATION:
{narration}

On-screen hook text (first second): {sc.get("hook_title", "")}

Write the search package. Rules:
- queries: the 3 searches a real person types that this video should win (plain words, lowercase, e.g.
  "why do knuckles crack"). Think YouTube + Google search, not hashtags.
- titles: 10 different title options. Each under 60 characters, the subject in the first 3 words, at most two
  ALL-CAPS words, no vague hype words (amazing, insane, crazy, epic, best, secret...). Prefer a specific
  number, name or fact. Curiosity is good, clickbait that the video doesn't pay off is not. Each title should
  contain the words of at least one query. Must not repeat the on-screen hook text word for word.
- description: first 2 lines = what the viewer gets, in the exact words of the queries (these lines are the
  search snippet). Then a blank line and 2-3 short sentences on what the video explains. No invented facts,
  numbers or sources beyond what the narration says. Do not include hashtags in the description.
- hashtags: 3-5 relevant hashtags (the first one is #shorts), no spaces.
- tags: up to 15 tags for disambiguation only - spellings, synonyms and phrasings people actually type. No
  unrelated or trending-but-irrelevant tags.
- instagram_caption: one curiosity line (not the same as the title) + one line inviting a comment or share,
  then 3-5 hashtags.

Return ONLY JSON:
{{"queries": ["...", "...", "..."], "titles": ["... x10"], "description": "...", "hashtags": ["#shorts", "..."],
  "tags": ["..."], "instagram_caption": "..."}}"""


def build(raw, sc):
    """Score titles, pick the best, run the query test."""
    queries = [q.strip() for q in (raw.get("queries") or []) if q.strip()][:3]
    titles = [check_title(t, sc.get("hook_title")) for t in (raw.get("titles") or []) if t and t.strip()]
    desc = (raw.get("description") or "").strip()
    for t in titles:                                   # titles must win at least one real search
        qc = query_check(t["title"], "", queries)
        hits = sum(1 for q in qc if q["ok"])
        t["search_hits"] = hits
        if hits:
            t["good"].append(f"matches {hits} target search{'es' if hits > 1 else ''}")
            t["score"] = min(100, t["score"] + 8 * hits)
        else:
            t["issues"].append("doesn't contain any target search - people won't find it by searching")
            t["score"] = max(0, t["score"] - 20)
    titles.sort(key=lambda r: -r["score"])
    best = titles[0]["title"] if titles else sc.get("title", "")
    tags = []
    for tg in raw.get("tags") or []:
        tg = tg.strip().lstrip("#")
        if tg and tg.lower() not in {x.lower() for x in tags} and len(tg) <= 30:
            tags.append(tg)
    hashtags = []
    for h in ["#shorts"] + list(raw.get("hashtags") or []):
        h = "#" + re.sub(r"[^A-Za-z0-9_]", "", h.lstrip("#"))
        if len(h) > 1 and h.lower() not in {x.lower() for x in hashtags}:
            hashtags.append(h)
    return {"queries": queries, "titles": titles[:10], "title": best, "description": desc,
            "tags": tags[:15], "hashtags": hashtags[:5],
            "instagram_caption": (raw.get("instagram_caption") or "").strip(),
            "query_check": query_check(best, desc, queries)}


def full_description(seo):
    """What goes into YouTube's description box."""
    return (f"{seo.get('description', '')}\n\n{' '.join(seo.get('hashtags') or ['#shorts'])}\n\n"
            "Made with AI tools and fact-checked. For curiosity and education - not medical advice.")


def upload_text(seo):
    return (f"YOUTUBE TITLE:\n{seo.get('title', '')}\n\nYOUTUBE DESCRIPTION:\n{full_description(seo)}\n\n"
            f"TAGS:\n{', '.join(seo.get('tags') or [])}\n\nINSTAGRAM CAPTION:\n{seo.get('instagram_caption', '')}")
