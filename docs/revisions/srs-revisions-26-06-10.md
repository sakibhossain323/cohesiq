# SRS Revisions — Documentation Overhaul: Docs Reconciled to Code

**Date:** 2026-06-10
**Author:** Documentation overhaul (team)
**Status:** Approved
**Affects:** `docs/srs.md` (structure), `docs/plan.md` (§2.1, §2.3, §3 D13/D14, §4), `docs/srs-revisions.md` (index), and several extracted/relocated docs (see below)

> Records the 2026-06-10 documentation overhaul that **reconciled the documentation to the live code** — **code is the source of truth**. Per the hierarchy in `docs/plan.md` §0, the SRS vision is never silently rewritten to match a shortcut; every code-driven divergence is captured in `docs/plan.md` §3 (Divergence Ledger) and referenced here. This batch is structural/documentation-only — no application code changed.

---

## 1. Why this overhaul

The docs had drifted from the codebase over a fast multi-day build:

- The matching weights documented in the SRS / plan (niche 0.35 / budget 0.30) no longer matched `backend/app/services/matching_config.py` (niche 0.45 / budget 0.20).
- The documented migration head (`0017`) lagged the live head (`0022`), and four new tables were undocumented.
- The SRS had grown into a single dense file mixing spec, user stories, personas, and embedded diagrams — hard to navigate and to keep code-true.
- Component-level detail for matching and YouTube lived inside revision docs rather than canonical reference docs.

The overhaul restructures the docs into an IEEE-shaped SRS plus focused companion docs, and corrects every code-vs-doc drift discovered.

---

## 2. Summary of changes

| Change | Affected doc(s) | Why / traceability |
|---|---|---|
| **SRS restructured to IEEE shape** (Introduction / Overall Description / Specific Requirements / Appendices) | `docs/srs.md` | Readability + auditability; aligns the spec with the BuildFest rubric's "Technical Execution" and "Presentation" criteria by making FR/NFR navigable. |
| **User stories extracted** to a dedicated file | `docs/srs.md` → `docs/user-stories.md` | US-1…US-20 now live in one place; SRS body references them. Keeps the spec focused; eases traceability against `docs/plan.md` §4 phases. |
| **Personas extracted** to a dedicated file | `docs/srs.md` → `docs/personas.md` | Separates audience/segment narrative from formal requirements (rubric: Real-World Impact, Business Model). |
| **Embedded diagrams removed from the SRS** — now live only in `docs/diagrams/` | `docs/srs.md`, `docs/diagrams/` | Single source for each diagram; diagrams **revalidated** against the live relational schema (`docs/schema.md`). No duplicate/stale copies in prose. |
| **Matching-weight drift corrected: 0.35 / 0.30 → 0.45 / 0.20** | `docs/plan.md` §3 D13, §4 Phase C; this record | **Code is the source of truth** — `SCORE_WEIGHTS` in `backend/app/services/matching_config.py`. Satisfies FR-11 transparency; the older 0.35/0.30 figure is **superseded**. |
| **Migration head doc-fix: 0017 → 0022** + new tables listed | `docs/plan.md` §2.3, §3 D14 | Documents `negotiation_turns`, `ai_match_scores` (extended), `contract_deliverables`, `live_content_metric_snapshots`, plus campaign visibility/invitation fields and the `archived` status. |
| **Component docs relocated** to canonical reference files | → `docs/matching-engine.md`, `docs/youtube-integration.md` | Matching pipeline and YouTube Tier-0 integration now have stable homes (previously scattered across dated revision docs). |
| **`submittable.md` rewritten to mirror `requirements.md`** | `docs/submittable.md` | The submission doc now tracks the immutable BuildFest baseline 1:1, so deliverables map directly to the rubric. |
| **D14 lifecycle wording tightened** | `docs/plan.md` §3 D14, §4 | Clarifies the offer-driven flow lives in `campaign_applications` + `negotiation_turns` + `contracts` (not as campaign states); campaign statuses are `draft`/`active`/`in_progress`/`completed`/`cancelled`/`archived`. |
| **Phase status refreshed (DONE)** | `docs/plan.md` §4 | Offer-driven lifecycle, admin panel, voice/PDF campaign creation, AI brief analysis, conflict-of-interest check, ROI/rate-benchmark tools marked done; partials refreshed. |

---

## 3. Matching-weight correction (FR-11 → plan.md D13)

The authoritative weights are `SCORE_WEIGHTS` in `backend/app/services/matching_config.py`:

| Signal | Documented (stale, superseded) | Live code (authoritative) |
|---|---|---|
| Niche fit | 0.35 | **0.45** |
| Budget compatibility | 0.30 | **0.20** |
| Platform match | 0.15 | 0.15 |
| Engagement quality | 0.10 | 0.10 |
| Language match | 0.08 | 0.08 |
| Content recency | 0.02 | 0.02 |

**Total: 1.00.** Niche is the dominant relevance signal; budget remains a meaningful but secondary commercial constraint. Supporting constants (also in `matching_config.py`): `BUDGET_SOFT_BUFFER_RATIO=0.30`, `BUDGET_RATE_HARD_CAP=1.30`, `BUDGET_UNKNOWN_SCORE=0.5`, `SEMANTIC_SIMILARITY_THRESHOLD=0.28`, `SEMANTIC_RESCUE_NICHE_CAP=0.40`, `UNKNOWN_RECENCY_SCORE=0.20`, `TOP_MATCH_LIMIT=10`, `LLM_RATIONALE_TOP_N=5`, `CONFLICT_LOOKBACK_DAYS=90`.

**Rule (reaffirmed):** never repeat weight values in docs/scripts/comments — reference the config file.

---

## 4. Migration head correction (0017 → 0022)

The live Alembic head is **`0022`**. New tables / fields since 0017:

| Object | Kind | Purpose |
|---|---|---|
| `negotiation_turns` | table | Multi-turn offer/counter-offer ledger backing the offer-driven negotiation (4 s frontend polling). |
| `ai_match_scores` | table (extended) | Persisted six-factor + semantic sub-scores. |
| `contract_deliverables` | table | Per-creator deliverable subset attached to a contract. |
| `live_content_metric_snapshots` | table | Day-7/14/30 live content-metric capture for ROI tracking. |
| `campaigns` (visibility/invitation fields, `archived` status) | columns/enum | Campaign visibility + invitation; new terminal-ish `archived` status. Statuses: `draft`/`active`/`in_progress`/`completed`/`cancelled`/`archived`. |

---

## 5. Rubric / traceability cross-references

| BuildFest criterion | How this overhaul supports it |
|---|---|
| Technical Execution (20%) | Docs now mirror the live five-stage pipeline and `matching_config.py`; FR-11 weights are code-true and auditable. |
| Presentation (10%) | IEEE-shaped SRS + extracted user-stories/personas + single-source diagrams make the spec demo-ready and navigable. |
| Real-World Impact / Ethical (20%) | Offer-driven lifecycle and conflict-of-interest check are documented as shipped (FR-13/FR-15); transparent sub-scores (FR-10) reaffirmed. |
| Business Model (20%) | `submittable.md` rewritten to mirror `requirements.md`, mapping deliverables to the rubric. |

---

## 6. Scope notes

- **Documentation-only.** No backend or frontend application code was modified in this batch.
- The SRS *vision* was **not** rewritten to match shortcuts — code-driven divergences remain recorded in `docs/plan.md` §3 (D13 corrected, D14 tightened).
- Companion docs (`docs/user-stories.md`, `docs/personas.md`, `docs/matching-engine.md`, `docs/youtube-integration.md`) are the new canonical homes for content extracted from the SRS.
