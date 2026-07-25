DO NOT EXECUTE THIS FILE. IT IS A DRAFT.

# 🎬 Cinema Guide — Build Workflow — Run each step fully before proceeding to the next.

---

## [ ] STEP 1 — Seed: Country Cinema Knowledge Dump

**Output: `_seed.md`**

Prompt:
"""
You are a film historian and cultural archivist with encyclopedic
knowledge of world cinema — including non-Western, pre-war, and
locally canonical films that rarely appear in Western critical
discourse. You are not biased toward festival circuit favorites
or Hollywood-adjacent productions.

For [COUNTRY], write a comprehensive brain dump covering:

1. List every significant film movement, era, or generation you know
   — with approximate dates and defining characteristics
2. List every director you associate with this country, grouped by era
3. List every film you associate with this country that a culturally
   curious traveler should know about — include obscure locally
   canonical ones, not just Western festival favorites
4. List any censorship, political, or distribution patterns that
   shaped the cinema
5. List cultural/cinematic terms specific to this country's film
   tradition that need glossary treatment

Format as raw lists. No prose. No filtering yet.
This is a knowledge dump, not a final document.
"""

Done when:
- [ ] At least 50 films listed
- [ ] At least 3 eras or movements identified
- [ ] At least 10 directors listed
- [ ] Saved as `_seed.md`

---

## [ ] STEP 2 — Research: Verify and Enrich

**Input: `_seed.md`**
**Output: `_research.md`**

Prompt:
"""
You are a meticulous film researcher and fact-checker.
Your job is verification, not curation or opinion.

For each film listed in the provided seed document, search and record:
- Confirmed IMDb title and URL
- Year
- Director
- Era/period depicted
- Major awards (won only, with category and year)
- Rotten Tomatoes score (if available)
- Whether it was banned or had distribution issues
- Primary filming location(s)

Also search:
- "[COUNTRY] cinema best films according to local critics"
- "[COUNTRY] film [native language] most important"
- Any films in the seed you could not verify → mark as UNVERIFIED

Format as a table. Flag uncertain entries clearly.
Do not add opinions or curatorial notes — only verified facts.
"""

Done when:
- [ ] All films from `_seed.md` have been looked up
- [ ] UNVERIFIED items are clearly flagged
- [ ] Saved as `_research.md`

---

## [ ] STEP 3 — Curation: Long List with Rationale

**Input: `_seed.md` + `_research.md`**
**Output: `_longlist.md`**

Prompt:
"""
You are a senior film curator preparing a cultural travel guide.
Your perspective is deliberately pluralist — you weigh local
critical tradition equally alongside Western sources like
Cahiers du Cinéma, Sight & Sound, and Criterion. When a film
is celebrated domestically but overlooked internationally,
you advocate for it. When a Western festival darling is
considered superficial by local critics, you note that tension.

Using the seed knowledge and verified research provided,
create a long list of the best candidate films for a
[COUNTRY] cinema guide targeted at: [TRAVELER_PROFILE].

For each candidate film provide:
- Title, year, director
- Which selection criterion it satisfies
  (history / landscape / local canon / foreign perspective /
  daily life / documentary)
- Which thematic section it belongs to
- Which era it covers
- A one-sentence curatorial note: why THIS film over alternatives

Then evaluate the long list against these constraints:
- At least 3 distinct historical periods covered?
- At least 4 local directors?
- No more than 4 films of the same genre?
- At least 1 documentary?
- At least 3 films before 1980?
- Regional diversity for large countries?
- Balance of local canon vs. Western festival recognition?

Flag any constraint that is not yet satisfied.
Do NOT reduce to [FILM_COUNT] yet — keep all strong candidates.
Remove only UNVERIFIED films from `_research.md`.
"""

Done when:
- [ ] Every candidate has a criterion and thematic tag
- [ ] Constraint checklist evaluated and gaps flagged
- [ ] Saved as `_longlist.md`

---

## [ ] STEP 4 — Selection: Iterate to Final N

**Input: `_longlist.md`**
**Output: `_selection.md`**

Prompt:
"""
You are a film festival programmer making final cuts for a
limited-slot retrospective. Every selection must earn its place.
When two films compete for the same slot, you choose with
precision and explain your reasoning.

From the long list provided, select exactly [FILM_COUNT] films.

Rules:
- Satisfy all constraints from the long list evaluation
- Where two films cover the same era and theme, keep the
  stronger one and explain why
- Distribute films across thematic sections as evenly as possible
- For each film NOT selected, write one sentence explaining
  why it was cut

Output two sections:
1. SELECTED ([FILM_COUNT] films) — with thematic section assignment
2. CUT — with one-sentence reasoning per film

Then do a final constraint check. If any constraint is still
unmet, swap the weakest selected film for the best cut film
that fixes the gap, and explain the swap.
"""

Done when:
- [ ] Exactly [FILM_COUNT] films selected
- [ ] All constraints satisfied
- [ ] Cut list with reasoning included
- [ ] Saved as `_selection.md`

---

## [ ] STEP 5 — Write: Cinema Guide Prose

**Input: `_seed.md` + `_research.md` + `_selection.md`**
**Output: `Cinema.md`**

Prompt:
"""
You are a film curator, cultural historian, and travel writer
with deep knowledge of world cinema. Your voice is journalistic —
vivid, opinionated, and accessible without being shallow.
You draw equally from the country's own critical tradition and
Western sources. You write for a culturally curious traveler,
not an academic.

Using the seed, research, and final selection provided,
write Cinema.md with the following sections:

1. Opening paragraph (3–5 sentences, distinctive and specific —
   no generic "cinema is a window into culture" phrases)
2. Historical overview table + 2–3 paragraphs of commentary
3. Thematic sections (one per cluster in _selection.md):
    - Intro paragraph (2–3 sentences)
    - Reference table: Film | Year | Focus | Location
    - 2–3 film commentaries (3–5 sentences each) for the
      most significant titles — connect to what the visitor
      will actually encounter or feel
    - Where relevant, note local vs. international critical
      reception differences
4. Glossary (3–6 entries as > blockquotes)

Only state facts confirmed in `_research.md`.
Full names only. Output language: [LANGUAGE].
Do NOT include the film cards — those are separate files.
"""

Done when:
- [ ] All 4 sections written
- [ ] No facts contradict `_research.md`
- [ ] Saved as `Cinema.md`

---

## [ ] STEP 6 — Generate Film Cards

**Tool: `Cinema - Movie Prompt.md`**
**Input: each film from `_selection.md` + `_research.md`**
**Output: `Cinema/Film Title (YEAR).md` × [FILM_COUNT] files**

Run "Cinema - Movie Prompt" for each selected film individually.
Pass the verified data from `_research.md` alongside each prompt
so the model uses confirmed facts rather than recalling from scratch.

For each card verify:
- [ ] Polygon coordinates fall within intended region
- [ ] Awards match `_research.md` (won vs. nominated)
- [ ] start/end dates reflect narrative period, not production year
- [ ] IMDb URL matches `_research.md`
- [ ] Saved as `Cinema/Film Title (YEAR).md`

Done when:
- [ ] All [FILM_COUNT] cards generated and verified
- [ ] All saved under `Cinema/` folder

---

## Parameters

COUNTRY: [COUNTRY]
LANGUAGE: [LANGUAGE]
FILM_COUNT: [FILM_COUNT]
TRAVELER_PROFILE: [TRAVELER_PROFILE] // (optional) e.g. "first-time visitor", "history enthusiast", "backpacker", "architecture lover"
FOCUS: [FOCUS] // (optional) e.g. "history", "landscape", "urban life", "political cinema"

Example output filenames:

```
Cinema.md
Cinema/
  To Live (1994).md
  Farewell My Concubine (1993).md
  Hero (2002).md
  ...
_seed.md          ← archive or delete
_research.md      ← archive or delete
_longlist.md      ← archive or delete
_selection.md     ← archive or delete
```
