# Use Case Diagram

> **As-built** — updated for the Contract entity change request (2026-06-06).
> The original SRS §9.1 diagram placed "Choose Collaboration Type" on the Campaign actor path.
> That use case has been moved to the Contract actor path (see §3 of `docs/srs-revisions.md`).
>
> Mermaid has no native UML use-case shape. Actors and use cases are modelled as a flowchart
> with `subgraph` system boundaries — the conventional Mermaid convention for UML use cases.

---

```mermaid
flowchart LR
    %% ── ACTORS ────────────────────────────────────────────────
    Brand([👤 Brand / SME])
    Creator([👤 Social Creator])
    Operator([👤 Platform Operator])
    Clerk([⚙️ Clerk Auth])
    Gemini([⚙️ Gemini 1.5 Flash])
    YouTube([⚙️ YouTube Data API v3])

    %% ── IDENTITY & ONBOARDING ─────────────────────────────────
    subgraph SB_Identity[Identity & Onboarding]
        UC1((Register / Login))
        UC2((Select Role\nbrand or creator))
        UC3((Complete Brand Profile))
        UC4((Complete Creator Profile))
        UC5((Add Social Profiles\n& Rate Cards))
        UC6((View Profile-Strength Meter))
    end

    %% ── CAMPAIGN MANAGEMENT ───────────────────────────────────
    subgraph SB_Campaign[Campaign Management]
        UC7((Create Campaign\nvia 4-step wizard))
        UC8((Set Visibility\nPublic or Private))
        UC9((Set BDT Budget\n& Creator Requirements))
        UC10((Analyze Brief\nwith AI))
        UC11((Edit Campaign))
        UC12((Invite Creator\nto Private Campaign))
    end

    %% ── MATCHING & DISCOVERY ──────────────────────────────────
    subgraph SB_Match[Matching & Discovery]
        UC13((Run AI Matching))
        UC14((View Ranked Creator Cards\nwith Match Score))
        UC15((View Score Breakdown\n6 sub-scores + rationale))
        UC16((Browse Creator Profiles))
        UC17((Compare Creators\nside-by-side))
        UC18((View Rate Benchmarks))
        UC19((Use ROI Calculator))
    end

    %% ── APPLICATION PIPELINE ──────────────────────────────────
    subgraph SB_Pipeline[Application Pipeline — Kanban]
        UC20((Apply to Campaign))
        UC21((Accept Invitation\nfrom Brand))
        UC22((Shortlist Applicant))
        UC23((Accept Applicant))
        UC24((Reject Applicant\nwith reason))
        UC25((Withdraw Application))
    end

    %% ── CONTRACT MANAGEMENT ───────────────────────────────────
    subgraph SB_Contract[Contract Management]
        UC26((Choose Engagement Type\nContent · Product · Talent))
        UC27((Configure Contract Clauses\npayment · revisions · exclusivity))
        UC28((Review Contract Summary\nwith fee breakdown))
        UC29((View Active Contracts))
        UC30((Track Contract Status\nstate machine))
    end

    %% ── CONTENT EXECUTION ─────────────────────────────────────
    subgraph SB_Execution[Content Execution]
        UC31((Submit Draft Content URL))
        UC32((Approve Content))
        UC33((Request Revision))
        UC34((Submit Live Post URL))
        UC35((Close Contract))
        UC36((Leave Review))
    end

    %% ── CREATOR EXPERIENCE ────────────────────────────────────
    subgraph SB_Creator[Creator Experience]
        UC37((Browse Public Campaigns))
        UC38((View My Collaborations))
        UC39((View My Contracts\nnext-action callout))
        UC40((View Earnings\n& Agreed Rates))
    end

    %% ── OPERATIONS ────────────────────────────────────────────
    subgraph SB_Ops[Platform Operations]
        UC41((Seed Demo Data))
        UC42((Sync Clerk Users))
        UC43((Run Matching\nfor seeded campaigns))
    end

    %% ── BRAND LINKS ───────────────────────────────────────────
    Brand --- UC1 & UC2 & UC3
    Brand --- UC7 & UC8 & UC9 & UC10 & UC11 & UC12
    Brand --- UC13 & UC14 & UC15 & UC16 & UC17 & UC18 & UC19
    Brand --- UC22 & UC23 & UC24
    Brand --- UC26 & UC27 & UC28 & UC29 & UC30
    Brand --- UC32 & UC33 & UC35 & UC36

    %% ── CREATOR LINKS ─────────────────────────────────────────
    Creator --- UC1 & UC2 & UC4 & UC5 & UC6
    Creator --- UC20 & UC21 & UC25
    Creator --- UC37 & UC38 & UC39 & UC40
    Creator --- UC31 & UC34 & UC36

    %% ── OPERATOR LINKS ────────────────────────────────────────
    Operator --- UC41 & UC42 & UC43

    %% ── SYSTEM / INCLUDE-EXTEND ───────────────────────────────
    UC1  -.includes.->  Clerk
    UC10 -.includes.->  Gemini
    UC13 -.includes.->  Gemini
    UC15 -.includes.->  Gemini
    UC5  -.includes.->  YouTube
    UC41 -.includes.->  YouTube

    UC23 -.triggers.->  UC26
    UC26 -.next step.-> UC27
    UC27 -.next step.-> UC28
    UC31 -.triggers.->  UC32
    UC31 -.triggers.->  UC33
    UC33 -.extends.->   UC30
    UC34 -.triggers.->  UC35
    UC35 -.triggers.->  UC36

    UC8  -.determines.-> UC12
    UC12 -.triggers.->   UC21
```

---

## Use case summary

### Brand journey
```
Register → Create Campaign (set visibility, budget, requirements)
→ Run Matching → Review scored creator cards
→ Shortlist → Accept applicant
→ Configure Contract (type + clauses + review fee breakdown)
→ Wait for draft → Approve or Request Revision
→ Wait for live post → Close Contract → Leave Review
```

### Creator journey
```
Register → Build Profile (social profiles, rate cards, portfolio)
→ Browse public campaigns → Apply with proposal
  OR receive invitation → Accept/Decline
→ My Contracts → Submit draft URL
→ Await brand approval → Submit live post URL
→ Contract closed → Leave Review
```

### Contract trigger
`UC23 (Accept Applicant)` always triggers `UC26 (Choose Engagement Type)` — the brand cannot
accept a creator without immediately entering the contract configuration flow. This is enforced
in the UI via `ContractCreateModal` and at the API level (no contract = no state transition past `accepted`).
