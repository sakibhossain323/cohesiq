# What is a Contract?

A contract is the **actual agreement** between a brand and a creator after they've decided to work together.

If a campaign is a job posting, a contract is the signed offer letter — it locks in what the creator will deliver, what the brand will pay (if anything), and what the rules are if something goes wrong.

In Cohesiq, a contract is created the moment a brand accepts a creator's application. From that point, the contract — not the campaign — governs everything.

---

## 1. Three Engagement Types

Every contract has a type that describes the **nature of the working relationship**. The type is not about payment — payment is a separate clause inside the contract. The type answers: *what is this collaboration fundamentally about?*

### Content Collaboration
The creator produces and publishes branded content on their own social channels.

- The brand provides the brief; the creator provides the audience and creative execution
- The creator's followers see the content as organic (with required disclosure: #ad or #sponsored)
- Typical deliverables: Instagram Reels, YouTube videos, TikTok posts, Stories
- Payment clause is almost always present (flat fee)
- Example: "Create a 60-second Reel featuring our new skincare product and post it to your Instagram"

### Product Seeding
The brand transfers a physical product to the creator. The creator engages with it — reviews it, showcases it, or uses it in content.

- The product may be kept by the creator (gifting) or returned after use (loan) — the `product_disposition` clause captures this
- A payment clause is optional — some brands gift product with no fee; others pay additionally
- Colloquially called "gifting" in marketing, but "product seeding" is more accurate because it covers both keep and return scenarios
- Example: "We'll send you our new running shoes. Post an honest review on Instagram. You keep the shoes."

### Talent Engagement
The creator appears at, hosts, or performs at a live event.

- The creator is hired for their presence and audience draw, not for online content production
- Deliverables are event-specific (appearance, hosting duties, speaking time)
- Payment clause is mandatory — talent is never expected to appear for free
- Example: "Host our product launch event at Dhaka Convention Centre, 2 hours, with 3 social posts"

---

## 2. What are Clauses?

A clause is one specific, enforceable term of the contract. Together, the clauses define the full working agreement. Think of each clause as answering one clear question.

| Clause | Question it answers |
|---|---|
| **Payment clause** | Is money changing hands? If so, how much, and when? |
| **Product transfer clause** | Is a physical product being sent? Does the creator keep it or return it? |
| **Deliverable clause** | What content must the creator produce, and when? |
| **Exclusivity clause** | Can the creator work with competitor brands during or after this collaboration? Can the brand reuse the content for ads? |
| **Revision clause** | How many rounds of changes can the brand request before the creator's obligation is fulfilled? |
| **Kill fee clause** | If the brand cancels after the creator has started work, what percentage of the agreed fee does the creator still receive? |

Not every clause applies to every contract. Product Seeding contracts may have no payment clause. Talent Engagement contracts always have a payment clause but may not have a product transfer clause.

---

## 3. The Contract State Machine

A contract moves through states in a fixed order. Each state represents where the engagement currently stands.

```
ACTIVE
  Contract created and locked. Simulated escrow holds the payment.
  Creator knows what to deliver.

    ↓ Creator starts producing content

IN PRODUCTION
  Creator is working. Brand is waiting.

    ↓ Creator submits draft content URL

CONTENT SUBMITTED
  Brand reviews the creator's draft.
  Brand can: Approve (→ Content Approved) or Request Revision (→ back to In Production).
  Revision requests are limited by the revision clause — once the limit is hit, the brand must approve or raise a dispute.

    ↓ Brand approves

CONTENT APPROVED
  Content is approved. Creator is cleared to publish.

    ↓ Creator posts publicly and submits the live post URL

PUBLISHED
  Content is live on the creator's channel.
  Brand verifies the post URL.

    ↓ Brand closes the contract

CLOSED
  Engagement complete. Payment released to creator.
  Both parties are prompted to leave a review.

─────────────────────────────────

DISPUTED  (can be entered from any active state)
  A party has flagged a problem — missed deadline, non-compliant content, non-payment.
  Requires manual resolution (platform support).
```

---

## 4. How Contracts Protect Both Parties

### For the creator (Arif's perspective)
- **Payment is locked at contract creation.** The brand cannot change the agreed amount after the contract is active. They can't lower it after you've already done the work.
- **Revision rounds are capped.** The brand cannot ask for unlimited changes. Once the revision limit is reached, the system blocks further requests — you only owe what you agreed to.
- **Kill fee applies if the brand walks away.** If the brand cancels after you've started production, the kill fee clause guarantees you receive a percentage of the fee even though the campaign didn't run.

### For the brand (Rasha's perspective)
- **Content is reviewed before going live.** The brand sees the draft and can request changes before the creator publishes anything publicly. Content that doesn't match the brief doesn't get published.
- **Usage rights are explicit.** If the brand wants to reuse the creator's content in paid ads, the exclusivity/usage-rights clause locks in permission and duration. No ambiguity.
- **Deliverables are specific.** The deliverable clause specifies exactly what the creator must produce — no "I thought one Story was enough" disputes.

### For both parties
- **Everything is timestamped.** Every state transition is recorded with a timestamp. There is always a clear audit trail of what happened and when.
- **Disputes are formalized.** If something goes wrong, either party can raise a dispute. This moves the contract into `disputed` state and escalates to platform support — rather than a WhatsApp argument.

---

## 5. Platform Fee

Cohesiq charges a platform fee on paid contracts. The fee is determined by contract type and locked in at contract creation.

| Contract type | Platform fee |
|---|---|
| Content Collaboration | 15% |
| Product Seeding | 10% |
| Talent Engagement | 18% |

The fee is deducted from the gross payment. Both parties see a breakdown:

```
Agreed payment:     BDT 20,000
Platform fee (15%): BDT  3,000
Net to creator:     BDT 17,000
```

For Product Seeding contracts with no payment clause, there is no platform fee.

---

## 6. Glossary

| Term | Meaning |
|---|---|
| **Contract type** | The nature of the engagement (Content Collaboration, Product Seeding, Talent Engagement) |
| **Clause** | One specific enforceable term within the contract |
| **Escrow (simulated)** | Payment held by the platform at contract creation; released to creator on contract close |
| **Revision round** | One cycle of: brand requests changes → creator resubmits |
| **Kill fee** | The percentage of the agreed fee the creator receives if the brand cancels mid-production |
| **Product disposition** | Whether the creator keeps the product (gifting) or returns it after use (loan) |
| **Usage rights** | Permission for the brand to repurpose the creator's content in ads, for a defined period |
| **Exclusivity** | A period during which the creator agrees not to work with competitor brands |
| **Audit trail** | A timestamped log of every state transition in the contract |
