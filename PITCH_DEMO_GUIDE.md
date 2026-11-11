# ReBur: Pitch & Video Demo Guide

> **Prepared for the Volopay Product Tech Assignment**  
> Use this guide, script, and step-by-step recording plan to record a pitch and product demonstration under 3 minutes.

---

## 🎯 1. The Core Pitch (The "Why Not Just Claude?" Test)

When recording your video pitch, open with this crisp problem statement:

> *"Large Language Models like Claude are phenomenal at understanding unstructured receipts and OCR text. But in real-world corporate spend management, **Claude alone is not enough**:*
> 1. *Claude cannot stay online or maintain shared financial state between employees and approvers.*
> 2. *Claude cannot deterministically enforce financial compliance policies without hallucinating.*
> 3. *Real money requires audited approval workflows, separation of duties, and ERP reconciliation.*
>
> *That’s why we built **ReBur**: Claude is the brain, and ReBur is the memory, rulebook, and front desk."*

---

## 🎬 2. Step-by-Step Screen Recording Walkthrough (3 Minutes)

### Minute 0:00 - 0:45 | Introduction & Executive Dashboard
1. Open **`http://localhost:3000`** in full screen.
2. Highlight the top bar: **ReBur - Volopay AI Engine** and the **FastAPI & MCP Online** health badge.
3. Walk through the 4 KPI cards:
   - **Pending Review:** Claims currently awaiting manager action.
   - **Policy Violations (Red Flagged):** Claims intercepted by the policy engine (e.g. >₹5,000 threshold or prohibited categories).
   - **Approved Spend:** Authorized reimbursements.
   - **Total Pipeline:** Combined corporate spend volume across the workspace.

---

### Minute 0:45 - 1:45 | The AI Agent & Policy Engine in Action
1. Click the **"AI Agent Simulator"** button in the top right navbar.
2. Explain: *"Here is how an employee or Claude Desktop interacts with ReBur via the Model Context Protocol (MCP)."*
3. **Scenario A (Compliant Claim):**
   - Click the preset: **"Clean Travel (₹940)"**.
   - Click **"Run AI Extraction & Policy Check"**.
   - Point out: The agent extracts the merchant (*Uber*), amount (*₹940*), category (*Travel*), and the policy check returns: **"Policy Evaluation Passed: Clean"**.
   - Click **"File Claim via MCP Bridge"**.
4. **Scenario B (Over-Threshold Violation):**
   - Click the preset: **"Client Banquet (₹14,800)"**.
   - Click **"Run AI Extraction & Policy Check"**.
   - Point out: The policy engine intercepts it: **"Exceeds standard auto-approval limit of ₹5,000. Requires Senior Manager approval."**
   - File it.
5. **Scenario C (Restricted Category Violation):**
   - Click the preset: **"Nightclub / Drinks (₹3,800)"**.
   - Point out: The policy engine flags **"Restricted policy violation: Expenses filed under 'Alcohol' violate corporate compliance."**
   - File it.

---

### Minute 1:45 - 2:30 | Manager Workflow & Approvals
1. Close the modal and return to the ledger.
2. Click the **"Policy Flags ⚠️"** tab:
   - Notice how all flagged items are isolated with clear compliance badges.
3. Click the **Eye icon (View Details)** on any claim:
   - Show the full modal: submitter, timestamp, business justification, and the exact policy engine audit card.
4. Demonstrate manager controls:
   - Click **"Approve"** on a compliant pending claim. Watch the status change to **Approved** and the **Approved Spend** KPI card update in real-time.
   - Click **"Reject"** on a prohibited claim.

---

### Minute 2:30 - 3:00 | ERP Export & Architecture Summary
1. Click the **"Export CSV"** button in the table header.
   - Open or show the downloaded CSV file containing all audited claims, approval states, and policy violation logs ready for payroll / ERP sync (NetSuite, QuickBooks, Tally).
2. Conclude with technical architecture:
   - **Frontend:** Next.js 14+ App Router, Tailwind CSS, Lucide icons.
   - **Backend:** FastAPI with FastMCP streamable transport, SQLite/Supabase dual persistence.
   - **Protocol:** Standard Model Context Protocol (MCP) compatible with Claude Desktop and autonomous AI agents.

---

## 📋 3. Quick Checklist Before You Record

- [ ] Run `./start.sh` and ensure both servers are active.
- [ ] Verify `http://localhost:3000` loads cleanly in your browser.
- [ ] Verify `http://localhost:8000/docs` is accessible.
- [ ] Set browser zoom to 100% or 110% for sharp text legibility on video.

