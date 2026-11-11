# ReBur: Role Personas & Testing Guide

> **Volopay Spend Governance & AI Expense Engine**  
> This document details the user personas, their responsibilities, access control boundaries (Segregation of Duties), and test prompt workflows for both the Web UI and Claude Desktop MCP.

---

## 👥 Overview of Personas

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     👤 Employee (Submitter)     │           │      🛡️ Manager (Approver)      │
│  Priya Sharma (user@rebur.io)   │           │ Devansh Gupta (manager@rebur.io)│
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ • Pre-check policy guidelines   │           │ • Executive spend KPI analytics │
│ • Extract receipt details (OCR) │           │ • Review policy violation flags │
│ • Submit expense claims         │           │ • 1-Click Approve / Reject      │
│ • Track reimbursement status    │           │ • Export CSV for ERP / Payroll  │
│ ❌ Cannot approve expenses      │           │ ❌ Cannot self-file expenses    │
└────────────────┬────────────────┘           └────────────────┬────────────────┘
                 │                                             │
                 └───────────────┐             ┌───────────────┘
                                 ▼             ▼
                    ┌───────────────────────────────┐
                    │     🤖 Claude MCP Agent       │
                    │   Model Context Protocol v1   │
                    │   Deterministic Policy Engine │
                    └───────────────────────────────┘
```

---

## 1. 👤 Persona: Employee (The Submitter)

### Profile
* **Name:** Priya Sharma
* **Title:** Senior Product Engineer
* **Email:** `user@rebur.io`
* **Password:** `password123`
* **Role ID:** `employee`

### User Story & Goals
> *"As an engineer traveling for client meetings and purchasing cloud tools, I want to quickly submit receipts, get instant feedback on whether my expense complies with company policy, and receive timely reimbursements without getting caught in surprise compliance audits."*

### Key Responsibilities & Capabilities
* **Pre-Check Policy Compliance:** Test whether an expense qualifies for auto-approval or exceeds thresholds *before* filing.
* **AI Receipt OCR:** Automatically parse vendor names, invoice dates, line items, and totals from receipt text.
* **Submit Reimbursement Claims:** Log claims into the system with business justifications.
* **Track Claim Status:** Real-time visibility into claims (`Pending Review`, `Policy Flag`, `Approved`, `Rejected`).

### Governance & Boundaries (Segregation of Duties)
* 🚫 **Cannot Approve Claims:** The `Approve` and `Reject` buttons are hidden in the ledger (`Needs Manager` label shown).
* 🚫 **Cannot Export ERP Accounting Data:** The `Export CSV` tool is restricted to finance managers.

### 🧪 How to Test as Employee

#### In the Web UI:
1. Log in via the account switcher with `user@rebur.io` (`password123`).
2. Notice the primary **`+ New Expense`** button is available in the navbar and header.
3. Submit a claim under ₹5,000 (e.g. ₹420 Uber ride) → Passes as **Compliant**.
4. Submit a claim over ₹5,000 (e.g. ₹8,500 banquet) → Real-time warning alerts you that **Senior Manager sign-off is required**.

#### In Claude Desktop (MCP):
* **Guideline Pre-Check:**
  > *"Hey Claude, I paid ₹7,500 for a team meal at Barbeque Nation. Does this pass our company policy guidelines, or will it get flagged?"*
  > 
  > *(Claude calls `check_expense_guidelines` and explains that amounts > ₹5,000 require senior manager approval and alcohol is restricted).*

* **File Expense Claim:**
  > *"Please file a ₹420 travel expense for Uber on 2026-11-10 under Priya Sharma."*
  > 
  > *(Claude executes `submit_expense` and confirms Claim ID).*

---

## 2. 🛡️ Persona: Manager / Approver (The Spend Controller)

### Profile
* **Name:** Devansh Gupta
* **Title:** VP of Finance & Operations
* **Email:** `manager@rebur.io`
* **Password:** `password123`
* **Role ID:** `manager`

### User Story & Goals
> *"As a finance leader responsible for company runway and audit compliance, I need an executive dashboard that surfaces high-risk spend, isolates duplicate claims, flags threshold violations, and lets me approve or reject claims with immutable audit logging."*

### Key Responsibilities & Capabilities
* **Executive Spend Oversight:** High-level visibility into Total Pipeline, Awaiting Review, Escalated Policy Flags, and Approved Volume.
* **Audit Policy Flags:** Filter by `Policy Flags ⚠️` to review claims that violated ceiling limits (>₹5,000), prohibited categories (alcohol/entertainment), or suspected duplicates.
* **1-Click Review Actions:** One-click **Approve** or **Reject** with timestamped actor auditing.
* **Payroll & ERP Sync:** One-click **Export CSV** formatted for NetSuite, QuickBooks, or payroll payout.

### Governance & Boundaries (Segregation of Duties)
* 🚫 **Cannot Self-File Expenses:** In compliance with financial audit rules, managers in Approver Mode cannot add expenses. The `+ New Expense` button is replaced with an `Approver Mode` badge. If a manager attempts to submit a claim, the system rejects it with:
  > *"Policy Violation: Managers cannot file expenses in Approver Mode (Segregation of Duties). Please switch to an Employee account."*

### 🧪 How to Test as Manager

#### In the Web UI:
1. Log in via the account switcher with `manager@rebur.io` (`password123`).
2. Notice the **Approver Mode** badge in the navbar and the **Export CSV** button in the header.
3. Review pending claims: Click **Approve** on compliant claims or **Reject** on flagged duplicates.
4. Filter by the **Policy Flags** tab to inspect all escalated violations.
5. Click **Export CSV** to download the audited reimbursement file.

#### In Claude Desktop (MCP):
* **Spend Risk Analysis:**
  > *"Claude, analyze our pending reimbursements for this week. Summarize the total spend volume and highlight any red flags or policy violations that need my sign-off."*
  > 
  > *(Claude calls `analyze_pending_reimbursements` and produces a breakdown of compliant claims vs. flagged violations).*

* **Conversational Approvals & Rejections:**
  > *"Please approve claim #44, and reject claim #45 because it's an identical duplicate."*
  > 
  > *(Claude calls `review_pending_expense` for each claim, updates the audit trail, and confirms the action).*

---

## 3. 🤖 Persona: Autonomous AI Agent (Claude / FastMCP)

### Profile
* **Name:** Claude Desktop / FastMCP Bridge
* **Protocol:** Model Context Protocol (MCP) v1
* **Service Name:** `VolopayExpenseManager`

### Role in the System
The AI Agent serves as the intelligent layer between unstructured user input (receipt text, chat prompts) and deterministic financial rulebooks.

### Exposed MCP Tools Matrix

| Tool Name | Intended Role | Description |
| :--- | :--- | :--- |
| `get_corporate_policy` | Both | Returns active company spend policy thresholds and prohibited categories. |
| `check_expense_guidelines` | Employee | Pre-evaluates an expense before submission to inform the employee of potential flags. |
| `submit_expense` | Employee | Submits an extracted claim and evaluates policy rules against the database. |
| `list_pending_expenses` | Manager | Lists all pending claims waiting for sign-off with compliance status tags. |
| `analyze_pending_reimbursements` | Manager | Performs executive audit analysis, aggregating pipeline totals and isolating red flags. |
| `review_pending_expense` | Manager | Approves or rejects a claim by ID and writes an entry to the immutable audit trail. |

---

## 4. Summary Matrix of Roles & Permissions

| Capability | 👤 Employee (`user@rebur.io`) | 🛡️ Manager (`manager@rebur.io`) | 🤖 AI Agent (Claude MCP) |
| :--- | :---: | :---: | :---: |
| View Claims Ledger | ✅ (Own / Team) | ✅ (All Workspace) | ✅ (`list_pending_expenses`) |
| Submit New Expense | ✅ Allowed | ❌ Blocked (SOD Rule) | ✅ (`submit_expense`) |
| Pre-Check Policy Rules | ✅ Allowed | ✅ Allowed | ✅ (`check_expense_guidelines`) |
| Approve / Reject Claims | ❌ Restricted | ✅ Allowed | ✅ (`review_pending_expense`) |
| View Audit Logs | ✅ (Read-Only) | ✅ (Full View) | ✅ |
| Export Accounting CSV | ❌ Restricted | ✅ Allowed | ❌ |
| Run AI OCR Simulator | ✅ Allowed | ✅ Allowed | Native |

