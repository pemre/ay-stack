DO NOT EXECUTE THIS FILE. IT IS A DRAFT.

# 🎬 Cinema Research Workflow

## [ ] Step 1 — Generate Country Cinema Guide
- Prompt: Country Cinema Guide + 12 Films (merged)
- Fill in: COUNTRY, LANGUAGE, FOCUS (optional), TRAVELER_PROFILE (optional)
- Output: save as `Cinema.md`
- Done when:
    - [ ] Historical overview table is complete
    - [ ] At least 3 thematic sections generated
    - [ ] Glossary entries written
    - [ ] 12 film cards present with 📍 and 🏷 tags
    - [ ] Viewing order and gaps section included

## [ ] Step 2 — Generate Film Cards
- Prompt: Film Card Prompt (v3)
- For each film from Step 1 worth a dedicated card:
    - [ ] Fill in: FILM_TITLE_AND_YEAR, LANGUAGE
    - [ ] Output: save as `Film Title (YEAR).md`
    - [ ] Verify: polygon coordinates fall within intended region
    - [ ] Verify: all awards marked as "won" were actually won
    - [ ] Verify: start/end dates reflect narrative period, not production year
    - [ ] Verify: IMDb URL resolves to correct film

## [ ] Step 3 — Review & Cross-link
- [ ] Check that no film appears in both Cinema.md and a card
  with contradictory information
- [ ] Confirm all locations in cards match Cinema.md references
- [ ] Add any missing films surfaced during card generation
  back into Cinema.md thematic tables
