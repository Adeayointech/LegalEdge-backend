# Lawravel — Complete User Manual

**Version:** 1.0  
**Platform:** lawravel.com  
**Last Updated:** May 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started — The Homepage](#2-getting-started--the-homepage)
3. [Creating an Account (Registration)](#3-creating-an-account-registration)
4. [Email Verification](#4-email-verification)
5. [Logging In](#5-logging-in)
6. [Forgot Password & Password Reset](#6-forgot-password--password-reset)
7. [The Dashboard](#7-the-dashboard)
8. [Navigating the Sidebar](#8-navigating-the-sidebar)
9. [Cases](#9-cases)
10. [Documents](#10-documents)
11. [Deadlines](#11-deadlines)
12. [Hearings](#12-hearings)
13. [Calendar](#13-calendar)
14. [Advanced Search](#14-advanced-search)
15. [Analytics Dashboard](#15-analytics-dashboard)
16. [User Management](#16-user-management)
17. [Branch Management](#17-branch-management)
18. [Audit Trail](#18-audit-trail)
19. [Notifications](#19-notifications)
20. [Profile & Account Settings](#20-profile--account-settings)
21. [Billing & Subscription](#21-billing--subscription)
22. [Support](#22-support)
23. [User Roles & Permissions](#23-user-roles--permissions)
24. [Platform Admin Panel (Lawravel Staff Only)](#24-platform-admin-panel-lawravel-staff-only)
25. [Tips & Best Practices](#25-tips--best-practices)

---

## 1. Introduction

**Lawravel** is a comprehensive legal practice management platform built for Nigerian law firms. It allows law firms to manage cases, documents, deadlines, court hearings, team members, and billing — all in one place.

### Who is Lawravel for?

- **Law firms** of all sizes — from solo practitioners to large multi-branch firms
- **All staff roles** — Partners, Associates, Paralegals, Secretaries, and clients
- **Firm administrators** who need oversight of operations and staff

### Key Benefits

- Centralise all your case files and documents
- Never miss a deadline or hearing date with automated email reminders
- Track the status of filed documents in court
- Monitor team performance with detailed analytics
- Maintain a complete audit trail of all activities
- Raise support tickets directly with the Lawravel team

---

## 2. Getting Started — The Homepage

When you visit **lawravel.com**, you land on the public homepage. This page is accessible to anyone, even without an account.

### What you will find on the homepage

- **Navigation bar** at the top with the Lawravel logo, and **Sign In** / **Get Started** buttons in the top right corner
- **Hero section** — a headline introducing the platform and two call-to-action buttons:
  - **Start Free Trial** — takes you to the registration page
  - **Sign In** — takes you to the login page
- **Features section** — highlights the core modules of the platform such as case management, document tracking, deadline reminders, and analytics
- **Pricing section** — displays the subscription tiers available (Monthly, Quarterly, 6-Month, Annual)
- **Footer** — links to Terms of Service and Privacy Policy, along with a copyright notice

> **Note:** You cannot access any firm data or features without logging in. The homepage is purely informational.

---

## 3. Creating an Account (Registration)

To use Lawravel, your firm needs an account. There are **two ways** to register:

### Option A — Create a New Firm

Use this if your law firm is not yet on Lawravel and you want to set it up.

**Steps:**

1. Click **Get Started** or **Start Free Trial** on the homepage, or go directly to `/register`
2. On the registration page, select **Create a new firm** (this is the default tab)
3. Fill in the following fields:
   - **First Name** — your given name
   - **Last Name** — your surname
   - **Email Address** — must be a valid, active email (a verification link will be sent here)
   - **Phone Number** — optional but recommended
   - **Law Firm Name** — the official name of your firm (e.g., *Ade & Partners Legal*)
   - **Password** — minimum 8 characters; choose something strong
   - **Confirm Password** — must match the password above
4. Tick the checkbox to agree to the **Terms of Service** and **Privacy Policy**
5. Click **Create Account**

**What happens next:**

- A verification email is sent to your email address
- You will see your firm's unique **Invite Code** on screen — **copy and save this code**. Your colleagues will need it to join your firm
- You will be prompted to verify your email before gaining full access

### Option B — Join an Existing Firm

Use this if someone at your firm has already created an account and shared the firm's invite code with you.

**Steps:**

1. Go to `/register` and select the **Join existing firm** tab
2. Fill in your personal details (First Name, Last Name, Email, Phone, Password)
3. Enter the **Firm Code** provided by your firm administrator
4. Agree to the Terms and click **Join Firm**

**What happens next:**

- Your account is created but placed in a **pending approval** state
- A firm administrator (Super Admin, Senior Partner, or Partner) must approve your account before you can log in
- You will see a message: *"Your account is pending approval. Please wait for a firm administrator to approve your access."*

> **Important:** Keep your **Firm Code** confidential. Anyone with this code can request to join your firm.

---

## 4. Email Verification

After creating a new firm account, Lawravel sends a verification email to the address you registered with.

**Steps:**

1. Open your email inbox and look for an email from Lawravel
2. Click the verification link in the email
3. You will be redirected to the platform and your email will be confirmed
4. You can now log in

> **Did not receive the email?** Check your spam or junk folder. If it is still not there, try registering again or contact support.

---

## 5. Logging In

Once your account is verified (and approved, if you joined an existing firm), you can log in.

**Steps:**

1. Go to **lawravel.com** and click **Sign In**, or navigate directly to `/login`
2. Enter your **Email Address** and **Password**
3. Click **Sign In**

### Two-Factor Authentication (2FA)

If you have enabled 2FA on your account, you will be asked for a **6-digit authentication code** after entering your password. Open your authenticator app (e.g., Google Authenticator or Authy), find the Lawravel entry, and enter the code shown.

### After Logging In

- **Firm staff** (any role except Platform Admin) will be taken to the **Dashboard**
- **Platform Admin** accounts will be taken directly to the **Platform Admin Panel**

### Login Errors

| Error Message | What it means |
|---|---|
| Invalid email or password | Your credentials are incorrect. Check caps lock. |
| Account not approved | A firm admin has not yet approved your account |
| Account not active | Your account has been deactivated. Contact your firm admin |
| Email not verified | You must click the link in your verification email first |

---

## 6. Forgot Password & Password Reset

If you cannot remember your password:

1. On the login page, click **Forgot password?**
2. Enter your registered **email address** and click **Send Reset Link**
3. Check your email for a password reset link
4. Click the link — it will take you to the **Reset Password** page
5. Enter your **new password** and **confirm it**
6. Click **Reset Password**
7. You will be redirected to the login page. Log in with your new password

> **Note:** Password reset links expire after a short period for security reasons. If the link has expired, repeat the process from step 1.

---

## 7. The Dashboard

After logging in, you arrive at the **Dashboard** — your firm's command centre.

### What you see on the Dashboard

#### Stats Cards (top row)
Three summary cards give you an instant overview:

- **Active Cases** — the number of cases currently active in your firm. Click **View all cases →** to go to the Cases page
- **Pending Deadlines** — deadlines that are not yet completed
- **Upcoming Hearings** — scheduled hearings that have not yet taken place

#### Recent Cases
A table listing your most recently created or updated cases, showing:
- Case title and suit number
- Client name
- Status badge (Pre-Trial, Ongoing, Judgment, Appeal, Closed)
- A **View** link to open the case details

#### Upcoming Deadlines
A list of the next few deadlines coming up across all your cases, showing:
- Deadline title and type
- Due date
- Status badge

#### Upcoming Hearings
A list of the next scheduled court hearings, showing:
- Hearing title
- Court name and location
- Date and time

> **Tip:** The Dashboard refreshes automatically. You do not need to manually reload the page to see new data.

---

## 8. Navigating the Sidebar

The left sidebar is your main navigation tool. It is present on all pages once you are logged in.

### Collapsing and Expanding the Sidebar

- On **desktop**, the sidebar can be toggled between an **expanded** view (showing icons and text labels) and a **collapsed** view (showing icons only). Click the **arrow/chevron icon** at the top of the sidebar to toggle it
- On **mobile**, the sidebar is hidden by default. Tap the **hamburger menu icon** (three lines) at the top left to open it. Tap anywhere outside the sidebar to close it

### Sidebar Contents

The sidebar shows different items depending on your role. For standard firm users, the sidebar contains:

| Icon | Label | Where it goes |
|---|---|---|
| Grid/squares icon | Dashboard | `/dashboard` — your home screen |
| Briefcase icon | Cases | `/cases` — all firm cases |
| Calendar icon | Calendar | `/calendar` — monthly calendar of hearings and deadlines |
| Search icon | Search | `/search` — global search across cases, documents, clients |
| Bar chart icon | Analytics | `/analytics` — charts and performance metrics |
| Users icon | Users | `/users` — manage team members (admin roles only) |
| Building icon | Branches | `/branches` — manage office locations |
| Shield/lock icon | Audit Trail | `/audit-logs` — activity log |
| Bell icon | Notifications | At the top of the sidebar — opens notification dropdown |
| Headset/ticket icon | Support | `/support` — raise and track support tickets |

### Bottom of the Sidebar

At the bottom you will find quick links to:
- **Profile** — your personal account settings
- **Billing** — subscription and payment information
- **Log Out** — signs you out immediately

### Branch Selector

If your firm has multiple branches, a **branch selector dropdown** appears near the top of the sidebar. This lets you filter all data (cases, documents, etc.) to show only records belonging to a specific branch, or show **All Branches**.

### Notification Bell

The bell icon near the top of the sidebar shows a **red badge** with the number of unread notifications. Click it to open a dropdown showing your most recent notifications. From there you can:
- Click a notification to navigate to the relevant record
- Click **View all** to go to the full Notifications page

### Support Badge

If you have an unread reply from the Lawravel support team on one of your tickets, a small **amber dot** or **number badge** will appear on the Support sidebar link. This is your cue to check the Support page for a response.

---

## 9. Cases

Cases are the core of Lawravel. Everything — documents, deadlines, hearings, assigned lawyers — is attached to a case.

### 9.1 Viewing the Case List

Navigate to **Cases** in the sidebar or go to `/cases`.

You will see:
- A **search bar** at the top — type any part of a case title, suit number, plaintiff name, or defendant name to filter the list instantly (search has a 0.5-second delay to avoid searching on every keystroke)
- A **status filter dropdown** — filter by Pre-Trial, Ongoing, Judgment, Appeal, or Closed
- Two tabs — **All Cases** and **My Cases** (My Cases shows only cases assigned to you)
- A table of cases with columns for: Case Information, Client, Type, Status, Resources (document and deadline counts), and Actions

### 9.2 Creating a New Case

Click the **+ New Case** button in the top right of the Cases page.

**Required fields:**

| Field | Description |
|---|---|
| Title | The name of the case (e.g., "Smith v. Johnson — Land Dispute") |
| Client | Search for an existing client by name, or type a new name and click **Create New Client** |
| Case Type | Civil, Criminal, Commercial, Family, Constitutional, Administrative, Labour, or Other |
| Status | Pre-Trial (default), Ongoing, Judgment, Appeal, or Closed |

**Optional fields:**

| Field | Description |
|---|---|
| Suit Number | The court-assigned case number (e.g., "FHC/ABJ/CV/123/2025") |
| Branch | The office branch handling this case |
| Court Name | Name of the court (e.g., "Federal High Court, Abuja") |
| Court Level | High Court, Court of Appeal, Supreme Court, etc. |
| Court Location | City or state where the court sits |
| Judge Name | Presiding judge's name |
| Plaintiff | Name of the claimant/plaintiff |
| Defendant | Name of the defendant/respondent |
| Opposing Counsel | Name and/or firm of opposing legal representation |
| Filing Date | The date the case was filed |
| Description | Free-text notes about the case |

Click **Create Case** when done. You will be taken directly to the new case's detail page.

### 9.3 Case Details Page

Click on any case in the list to open its detail page. This page has three tabs:

#### Tab 1 — Overview

Shows all the case's core information in a clean layout:
- **Case Information** — Suit number, case type, status, branch
- **Court Details** — Court name, level, location, judge's name
- **Parties** — Plaintiff, defendant, opposing counsel
- **Description** — Free-text notes
- **Filing Date**
- **Assigned Lawyers** panel (see Section 9.4)

#### Tab 2 — Deadlines

Shows all deadlines attached to this case. See **Section 11** for full details on how to add and manage deadlines.

The tab label shows the total number of deadlines in brackets, e.g., **Deadlines (4)**.

#### Tab 3 — Hearings

Shows all hearings scheduled for this case. See **Section 12** for full details.

The tab label shows the total number of hearings in brackets, e.g., **Hearings (2)**.

#### Documents Button

At the top right of the case detail page is a gold **Documents** button. Click it to go to the documents page for that case. See **Section 10** for full details.

### 9.4 Assigning Lawyers to a Case

On the **Overview** tab of a case, there is an **Assigned Lawyers** panel on the right side.

- If you have the role of **Super Admin, Senior Partner, or Partner**, you will see an **Assign Lawyer** button
- Click it, select a lawyer from the dropdown, optionally enter their role on this case (e.g., "Lead Counsel"), and click **Assign**
- To remove a lawyer, click the **X** next to their name in the panel
- Assigned lawyers can see and work on the case

### 9.5 Exporting Cases to CSV

On the Cases list page, there is an **Export CSV** button next to the New Case button (visible to Admins, Partners, and Associates).

Click it to download a spreadsheet of all cases (optionally filtered by status). This is useful for reporting or offline record keeping.

---

## 10. Documents

Documents are attached to individual cases and track the lifecycle of legal paperwork from draft to filed to served in court.

### 10.1 Opening the Documents Page

From any case detail page, click the gold **Documents** button at the top right. This takes you to `/cases/:id/documents`.

### 10.2 What you will see

The documents page has two sections:

1. **Filing Tracker** (top) — a summary dashboard showing:
   - Filed & Served count
   - Ready to File count
   - Drafts count
   - Rejected count
   - A breakdown by document type with a progress bar showing what percentage has been filed

2. **Document List** (below) — all documents uploaded to this case

### 10.3 Uploading a Document

Click the **Upload Document** button on the documents page.

**Fields:**

| Field | Description |
|---|---|
| Title | A clear name for the document |
| Document Type | Choose from: Complaint, Motion, Brief, Affidavit, Exhibit, Pleading, Court Order, Judgment, Appeal, Contract, Discovery Request, Discovery Response, Deposition, Subpoena, Correspondence, Invoice, Receipt, Evidence, Other |
| Status | Draft (default), Ready to File, Filed, Served, or Rejected |
| Notes | Optional free-text notes about the document |
| File | Click to select a file from your computer |

Click **Upload** to save. The document will appear in the list and the filing tracker will update.

### 10.4 Document Statuses Explained

| Status | Meaning |
|---|---|
| **Draft** | The document is being prepared and is not ready for filing |
| **Ready to File** | The document is finalised and ready to be submitted to court |
| **Filed** | The document has been physically or electronically filed with the court |
| **Served** | The document has been filed and served on all opposing parties |
| **Rejected** | The court or relevant authority rejected the filing |

### 10.5 Updating a Document's Status

1. In the document list, click the **pencil (edit) icon** on the document you want to update
2. A modal will open — update the **Status**, and optionally add a **Filed Date** and **Filed By** (who filed it)
3. Click **Save**

The Filing Tracker will automatically recalculate when you update a status.

### 10.6 Downloading a Document

Click the **download icon** next to any document to download the original file to your device.

### 10.7 Deleting a Document

Click the **trash icon** next to a document. You will be asked to confirm before the document is permanently deleted.

### 10.8 Filtering Documents

At the top of the document list there are two filters:
- **Search bar** — search by document title
- **Type filter** — filter by document type (Complaint, Motion, etc.)
- **Status filter** — filter by filing status

---

## 11. Deadlines

Deadlines help you track important dates attached to a case — filing deadlines, response deadlines, judgment dates, and more.

### 11.1 Viewing Deadlines

Open any case and click the **Deadlines** tab. The number in brackets shows how many deadlines exist for that case.

Each deadline card shows:
- Deadline title and type
- Due date
- Status badge (Pending, Completed, Missed, Extended)
- Days remaining or overdue

### 11.2 Adding a Deadline

On the Deadlines tab, click **+ Add Deadline**.

**Fields:**

| Field | Description |
|---|---|
| Title | Brief name for the deadline (e.g., "File Reply Brief") |
| Type | Filing Deadline, Response Deadline, Hearing Date, Judgment Date, Appeal Deadline, Submission Deadline, or Other |
| Due Date | The date by which this must be completed |
| Description | Optional notes |
| Reminder | Toggle to enable email reminders (see Section 11.4) |

Click **Create Deadline**.

### 11.3 Deadline Statuses

| Status | Meaning |
|---|---|
| **Pending** | Not yet completed; due date is in the future or has passed |
| **Completed** | Manually marked as done |
| **Missed** | The due date has passed and it was not completed |
| **Extended** | The deadline was extended (updated due date) |

### 11.4 Marking a Deadline as Complete

On the deadline card, click the **Check/Tick icon** or the **Mark Complete** button. A confirmation prompt will appear. Click OK to confirm. The status changes to **Completed**.

### 11.5 Setting Up Email Reminders

Each deadline can have automated email reminders configured.

1. Click the **Bell icon** on a deadline card
2. The **Reminder Settings** panel opens
3. Toggle **Enable Reminders** to ON
4. Select one or more reminder intervals:
   - On Due Date
   - 1 Day Before
   - 2 Days Before
   - 3 Days Before
   - 1 Week Before
   - 2 Weeks Before
   - 1 Month Before
5. Click **Save**

You can also click **Send Test Reminder** to immediately send a test email to your registered email address to verify it is working.

### 11.6 Editing a Deadline

Click the **Edit (pencil) icon** on a deadline card to modify its title, type, due date, or description.

### 11.7 Deleting a Deadline

Click the **Trash icon** on a deadline card. Confirm the deletion when prompted.

### 11.8 Filtering Deadlines

Use the **status filter** dropdown above the deadline list to show only Pending, Completed, Missed, or Extended deadlines.

### 11.9 Exporting Deadlines to CSV

Click the **Export CSV** button to download all deadlines for the case as a spreadsheet.

---

## 12. Hearings

Hearings track court appearances associated with a case — their date, time, venue, presiding judge, and outcome.

### 12.1 Viewing Hearings

Open any case and click the **Hearings** tab. The number in brackets shows how many hearings are scheduled.

Each hearing card shows:
- Hearing title
- Date and time
- Court and location
- Judge's name (if entered)
- Status (Upcoming / Past)
- Outcome (if the hearing has taken place)

### 12.2 Scheduling a Hearing

On the Hearings tab, click **+ Add Hearing**.

**Fields:**

| Field | Description |
|---|---|
| Title | Brief name (e.g., "Bail Application Hearing") |
| Hearing Date | Date and time of the hearing |
| Court Name | Where the hearing will take place |
| Court Location | City or address |
| Judge Name | Presiding judge (optional) |
| Notes | Any additional notes |

Click **Add Hearing** to save.

### 12.3 Setting Up Hearing Reminders

Like deadlines, each hearing can have email reminders:

1. Click the **Bell icon** on a hearing card
2. Toggle **Enable Reminders** to ON
3. Choose reminder intervals (same options as deadlines, plus "On Hearing Date")
4. Click **Save**

You can send a **Test Reminder** to verify the email is working.

### 12.4 Editing or Deleting a Hearing

- Click the **Edit icon** to modify hearing details
- Click the **Trash icon** to delete. Confirm when prompted

### 12.5 Hearing Outcomes

After a hearing has taken place, you can record the outcome by editing the hearing and selecting the outcome from the list (e.g., Adjourned, Judgment Delivered, Dismissed, Settled, etc.). This information feeds into the Analytics Dashboard.

---

## 13. Calendar

The Calendar gives you a bird's-eye view of all upcoming hearings and deadlines across all your firm's cases in a monthly calendar format.

### 13.1 Opening the Calendar

Click **Calendar** in the sidebar or go to `/calendar`.

### 13.2 Navigating the Calendar

- Use the **left arrow** (◀) to go to the previous month
- Use the **right arrow** (▶) to go to the next month
- The current month and year are displayed in the centre

### 13.3 Reading the Calendar

- Each **date cell** may contain coloured dots or markers indicating events on that day:
  - **Blue** events — Hearings
  - **Amber/Orange** events — Deadlines
- The **current date** is highlighted
- Days with events show a preview of event titles within the cell (or dots if there are many)

### 13.4 Viewing Events for a Day

Click on any date to see a detailed panel (on the right side or below the calendar) listing all events for that day, including:
- Event title
- Type (Hearing or Deadline)
- The case it belongs to
- Time (for hearings) or due date (for deadlines)
- A link to the relevant case

---

## 14. Advanced Search

The Advanced Search allows you to search across all **cases**, **documents**, and **clients** simultaneously with powerful filters.

### 14.1 Opening Search

Click **Search** in the sidebar or go to `/search`.

### 14.2 Basic Search

1. Type your search term in the main search bar (e.g., a client's name, a suit number, a document title)
2. Click the **Search** button (or press Enter)
3. Results will appear below, grouped by type

### 14.3 Filtering Results

Click **Filters** to expand the filter panel. Available filters include:

| Filter | Applies to |
|---|---|
| Search type | All, Cases only, Documents only, Clients only |
| Status | Filter cases or documents by their status |
| Case Type | Filter cases by type (Civil, Criminal, etc.) |
| Document Type | Filter documents by type (Motion, Brief, etc.) |
| Branch | Limit results to a specific office branch |
| Start Date | Only show records created after this date |
| End Date | Only show records created before this date |

Click **Clear Filters** to reset all filters.

### 14.4 Reading Search Results

Results are displayed in three sections:

- **Cases** — shows matching case titles, suit numbers, status, and a link to open each case
- **Documents** — shows document titles, type, status, and which case they belong to. Click to navigate to the document
- **Clients** — shows client names and type (Individual or Corporate). Click to view their cases

### 14.5 Pagination

If there are more than 20 results, use the **Previous / Next** buttons at the bottom to navigate through pages.

---

## 15. Analytics Dashboard

The Analytics Dashboard provides visual charts and performance metrics about your firm's operations.

### 15.1 Opening Analytics

Click **Analytics** in the sidebar or go to `/analytics`.

### 15.2 Applying Filters

At the top of the page:
- **Branch filter** — select a specific branch or leave as "All Branches"
- **Start Date / End Date** — limit the data to a specific time period

### 15.3 Available Charts and Metrics

#### Cases Overview
- **Cases by Status** (Pie chart) — how many cases are Pre-Trial, Ongoing, Judgment, Appeal, or Closed
- **Cases by Type** (Pie chart) — breakdown of Civil, Criminal, Commercial, etc.
- **Cases Over Time** (Line chart) — how many new cases were created each month
- **Average Case Duration** — average number of days a case has been open

#### Documents Overview
- **Documents by Type** (Bar chart) — how many documents of each type exist
- **Documents by Status** (Pie chart) — Drafts, Ready to File, Filed, Served, Rejected
- **Documents Over Time** (Line chart) — documents uploaded per month

#### Combined Timeline
- A combined line chart overlaying Cases and Documents over time to spot trends

#### Deadline Compliance
- **Compliance Rate** — what percentage of deadlines were completed on time (shown as a large percentage)
- **Deadline Breakdown** (Pie chart) — On Time, Late, Overdue
- **Upcoming** — count of deadlines due in the next 30 days
- **Overdue** — count of deadlines that have passed without being completed

#### Hearings
- **Hearings by Outcome** (Pie chart) — breakdown of Adjourned, Judgment Delivered, Dismissed, etc.

#### Branch Performance
- If your firm has multiple branches, a table shows a per-branch breakdown of cases, documents, and users

---

## 16. User Management

This section is for firm administrators to manage who has access to the system and what they can do.

### 16.1 Who can manage users?

| Role | Can view users | Can approve/deactivate | Can change roles |
|---|---|---|---|
| Super Admin | ✓ | ✓ | ✓ |
| Senior Partner | ✓ | ✓ | ✓ |
| Partner | ✓ | ✓ | ✗ |
| Associate and below | ✗ | ✗ | ✗ |

### 16.2 Opening User Management

Click **Users** in the sidebar or go to `/users`.

### 16.3 The User List

You will see a table of all users in your firm with the following columns:
- Full name and email
- Phone number
- Role (colour-coded badge)
- Branch assignment
- Status (Active / Inactive)
- Approval status (Approved / Pending)
- Last login date
- Actions

### 16.4 Approving a New User

When someone joins your firm using the firm code, their account appears in the user list with a **Pending Approval** badge.

To approve them:
1. Find the user in the list
2. Click the **Approve** button in the Actions column
3. A confirmation modal will appear — confirm to grant them access

Once approved, the user can log in.

### 16.5 Changing a User's Role

1. Find the user in the list
2. Click the **Change Role** button
3. A modal will open — select the new role from the dropdown
4. Optionally, assign them to a specific **branch**
5. Click **Save**

> **Note:** Only Super Admins and Senior Partners can change roles.

### 16.6 Deactivating a User

If someone leaves the firm or should no longer have access:
1. Find the user in the list
2. Click the **Deactivate** button (shown as a user-minus icon)
3. Confirm the action

A deactivated user cannot log in. Their historical data (cases they worked on, documents they uploaded) remains visible.

To **reactivate** a user, click the **Activate** button on their row.

### 16.7 User Roles Reference

See **Section 23** for a full breakdown of what each role can and cannot do.

---

## 17. Branch Management

If your law firm has multiple offices or locations, you can manage them as separate **branches**. Each case, user, and document can be assigned to a branch.

### 17.1 Opening Branch Management

Click **Branches** in the sidebar or go to `/branches`.

### 17.2 The Branch List

You will see a grid of all branches. Each card shows:
- Branch name and code (a short identifier, e.g., "ABJ")
- Whether it is the **Headquarters** (marked with a blue border)
- Address and city
- Number of staff members
- Number of cases
- Active / Inactive status
- Edit and Delete buttons

### 17.3 Creating a Branch

Click **+ Add Branch**.

**Fields:**

| Field | Description |
|---|---|
| Branch Name | Full name (e.g., "Lagos Island Office") |
| Branch Code | Short 2-6 character code (e.g., "LGS") |
| Address | Street address |
| City | City the branch is in |
| State | Nigerian state |
| Phone | Branch phone number |
| Email | Branch email address |
| Is Headquarters | Toggle on if this is the main/head office |

Click **Create Branch**.

### 17.4 Editing a Branch

Click the **Edit (pencil) icon** on a branch card. Update any fields and click **Save**.

### 17.5 Deleting a Branch

Click the **Trash icon** on a branch card and confirm. 

> **Note:** A branch cannot be deleted if it has users or cases assigned to it. You must reassign those first.

### 17.6 Switching Branches (Branch Selector)

At the top of the sidebar, there is a **branch selector dropdown**. Use this to filter all data to a specific branch. Select **All Branches** to see everything firm-wide.

---

## 18. Audit Trail

The Audit Trail records every significant action taken in the system — who did what, and when. It is a read-only log used for compliance, internal oversight, and security purposes.

### 18.1 Opening the Audit Trail

Click **Audit Trail** in the sidebar or go to `/audit-logs`.

### 18.2 What is logged

The audit trail records actions such as:
- User logins
- Cases created, updated, or deleted
- Documents uploaded or deleted
- Deadlines added, completed, or deleted
- Hearings added or deleted
- Users approved, deactivated, or had their roles changed
- Branches created or modified

### 18.3 Reading the Audit Log

Each entry shows:
- **Action type** (colour-coded badge): CREATE (green), UPDATE (blue), DELETE (red), LOGIN (purple), READ (grey)
- **Who** performed the action — user's name and email
- **What** was affected — entity type and name/ID
- **When** — date and time (with time zone)
- **Details** — a summary of what changed

### 18.4 Filtering the Audit Trail

Use the filter panel to narrow down logs:

| Filter | Description |
|---|---|
| Action | Filter by CREATE, UPDATE, DELETE, LOGIN, READ |
| Entity Type | Filter by what was affected (Case, Document, User, etc.) |
| User | Filter by a specific user's ID |
| Start Date | Show only logs from this date onwards |
| End Date | Show only logs up to this date |

### 18.5 Pagination

The audit log shows 50 entries per page. Use the **Previous / Next** buttons at the bottom to navigate. The total number of log entries is shown at the top right.

---

## 19. Notifications

Lawravel keeps you informed of important events through real-time notifications delivered in the platform.

### 19.1 The Notification Bell

In the sidebar (near the top), there is a **bell icon**. When you have unread notifications, a **red badge** showing the count will appear on it.

Click the bell to open a **dropdown panel** showing your most recent notifications. Each notification shows:
- An emoji icon indicating the type
- A title and short message
- How long ago it was received

Click any notification to navigate to the relevant record. Click **View all** at the bottom to go to the full notifications page.

### 19.2 The Notifications Page

Go to `/notifications` or click **View all** in the bell dropdown.

**Features:**
- **Filter tabs** — switch between **All** notifications and **Unread** only
- **Mark all as read** button — clears all unread indicators at once
- Individual notifications can be clicked to mark them as read and navigate to the relevant record

### 19.3 Types of Notifications

| Type | When you receive it |
|---|---|
| ⏰ Deadline Reminder | Your configured reminder interval before a deadline is due |
| 🚨 Deadline Overdue | A deadline has passed without being completed |
| 🏛️ Hearing Reminder | Your configured reminder interval before a hearing |
| ⚖️ Case Assigned | You have been assigned to a case |
| 📄 Document Uploaded | A new document has been uploaded to a case you are on |
| 👤 User Approval | A new user in your firm is waiting for approval (admin only) |
| 🎫 Support Ticket | The Lawravel team has replied to your support ticket |

### 19.4 Real-Time Updates

Notifications are delivered in real-time via WebSocket. You do not need to refresh the page — the bell badge and notification list update automatically when a new notification arrives.

---

## 20. Profile & Account Settings

Your profile contains your personal information and security settings.

### 20.1 Opening Your Profile

Click your name or the **Profile** link at the bottom of the sidebar, or go to `/profile`.

### 20.2 Profile Information Displayed

Your profile page shows:
- **Personal Details** — First name, last name, email, phone number
- **Account Info** — Your role in the firm, account status (Active/Inactive), whether your account is approved, when you joined
- **Organisation Details** — Your firm's name, invite code, address, and your assigned branch
- **Security Info** — Whether Two-Factor Authentication is enabled

### 20.3 Editing Your Personal Details

1. Click the **Edit Profile** button
2. Update your **First Name**, **Last Name**, and/or **Phone Number** (email cannot be changed)
3. Click **Save Changes**

### 20.4 Changing Your Password

1. Click the **Change Password** button
2. A modal will open with three fields:
   - **Current Password** — your existing password
   - **New Password** — your desired new password
   - **Confirm New Password** — type the new password again
3. Use the eye icon to show/hide each field
4. Click **Change Password**

> **Important:** Passwords are not shown in the system. If you forget your current password, use the **Forgot Password** flow on the login page.

### 20.5 Two-Factor Authentication (2FA)

Two-Factor Authentication adds an extra layer of security to your account. When enabled, you must enter a 6-digit code from an authenticator app in addition to your password when logging in.

**To enable 2FA:**
1. Go to your Profile page
2. In the Security section, click **Enable Two-Factor Authentication** (if not already enabled)
3. You will be shown a **QR code** — scan this with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
4. Enter the **6-digit code** shown in your app to confirm setup
5. 2FA is now active

**To disable 2FA:**
1. On your Profile page in the Security section, click **Disable Two-Factor Authentication**
2. Enter the current 6-digit code from your app to confirm
3. 2FA will be disabled

---

## 21. Billing & Subscription

The Billing page shows your firm's current subscription status and allows you to purchase or renew your plan. This section is visible to all users but only **Super Admins** can initiate payments.

### 21.1 Opening the Billing Page

Click **Billing** at the bottom of the sidebar or go to `/billing`.

### 21.2 Subscription Statuses

| Status | Meaning |
|---|---|
| **Free Trial** | Your firm is on the initial free trial period. Full access is available until the trial ends. |
| **Active** | Your subscription is paid and current. |
| **Grace Period** | Your subscription has expired but you still have limited access. Pay immediately to avoid lockout. |
| **Expired** | The grace period has ended. Access is restricted until payment is made. |
| **Cancelled** | The subscription has been cancelled. Contact support to reactivate. |

### 21.3 Subscription Plans

Lawravel is priced as a firm-wide subscription in Nigerian Naira (₦):

| Plan | Price | Savings |
|---|---|---|
| Monthly | ₦25,000 / month | — |
| Quarterly (3 months) | ₦70,000 total (₦23,333/mo) | Save ₦5,000 |
| 6 Months | ₦135,000 total (₦22,500/mo) | Save ₦15,000 |
| Annual (Yearly) | ₦250,000 total (₦20,833/mo) | **Best Value** — Save ₦50,000 |

All plans include:
- Unlimited cases and documents
- Unlimited team members
- Deadline and hearing reminders (email)
- CSV exports and audit logs
- Multi-branch support

The subscription covers your **entire firm** — all branches, all users.

### 21.4 Making a Payment (Super Admin only)

1. On the Billing page, select your preferred plan by clicking on it
2. Click **Pay with Paystack**
3. You will be redirected to **Paystack's** secure payment page
4. Complete the payment using your card, bank transfer, or any Paystack-supported method
5. Once payment is confirmed, Paystack redirects you back to Lawravel
6. Your subscription status will update automatically to **Active**

> **Note:** Paystack is a PCI-DSS compliant payment processor. Lawravel does not store your card details.

### 21.5 Trial Period

New firms start on a **free trial**. The billing page shows:
- The date your trial ends
- The number of days remaining

When the trial ends, you will need to subscribe to continue using the platform.

### 21.6 Grace Period

If your subscription expires and you do not renew immediately, a **grace period** begins. During this time:
- You can still access the platform
- A banner at the top of every page will warn you of the expiry
- The billing page will show how many days of grace remain

Once the grace period ends, access becomes restricted until a new payment is made.

---

## 22. Support

The Support section allows you to communicate directly with the Lawravel support team. You can raise issues, ask questions, or report bugs.

### 22.1 Opening Support

Click **Support** in the sidebar or go to `/support`.

### 22.2 Raising a New Ticket

Click the **+ New Ticket** button.

**Fields:**

| Field | Description |
|---|---|
| Subject | A brief summary of your issue (e.g., "Unable to upload documents") |
| Message | A detailed description of your problem, question, or feedback |
| Priority | Low, Medium, High, or Urgent |

Click **Submit Ticket**.

Your ticket will appear in the list below with a status of **OPEN**.

### 22.3 Ticket Statuses

| Status | Meaning |
|---|---|
| **OPEN** | Ticket submitted; awaiting a response from Lawravel support |
| **IN PROGRESS** | A support agent is actively working on your issue |
| **RESOLVED** | The issue has been resolved |
| **CLOSED** | The ticket has been closed |

### 22.4 Viewing Ticket History

All your tickets are listed on the Support page. Click on any ticket to expand it and see:
- Your original message
- The **admin response** (shown in an amber/gold box) if Lawravel has replied
- Your **reply** to the admin (shown in a blue box) if you have replied
- The date each message was sent

### 22.5 Replying to an Admin Response

If the Lawravel support team has responded to your ticket (you will see an amber box with "Response from support"), and the ticket is still **OPEN** or **IN PROGRESS** (not Resolved or Closed):

1. Click the **Reply to support** button below the admin response
2. A text area will appear — type your reply
3. Click **Send Reply**

Your reply will appear in a blue box. The Lawravel team will be notified.

> **Note:** Once a ticket is marked **RESOLVED** or **CLOSED**, replies are disabled. If you have a new issue, raise a new ticket.

### 22.6 The Unread Reply Indicator

When Lawravel responds to your ticket, a small **amber dot** will appear on the Support icon in the sidebar (or a number badge if there are multiple unread replies). This disappears once you open the Support page and view the response.

### 22.7 Priority Levels Guide

| Priority | When to use |
|---|---|
| **Low** | General questions, feedback, minor cosmetic issues |
| **Medium** | Features not working as expected but there is a workaround |
| **High** | Important features broken, affecting your work significantly |
| **Urgent** | System inaccessible, data concern, or critical blocking issue |

---

## 23. User Roles & Permissions

Lawravel has a structured role-based access system. Each user in a firm is assigned one role.

### Role Overview

| Role | Typical User | Access Level |
|---|---|---|
| **Super Admin** | Firm IT lead or managing partner | Full access to everything |
| **Senior Partner** | Managing/founding partner | Full access except platform settings |
| **Partner** | Equity partner | Broad access; can manage users and cases |
| **Associate** | Junior lawyer | Can manage cases; limited admin functions |
| **Paralegal** | Paralegal staff | Read access; can work on documents |
| **Secretary** | Administrative staff | Read access; limited data entry |
| **Client** | Firm clients | View-only access to their own cases |

### Detailed Permissions

| Action | Super Admin | Senior Partner | Partner | Associate | Paralegal | Secretary | Client |
|---|---|---|---|---|---|---|---|
| View cases | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Own only |
| Create cases | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Assign lawyers | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Upload documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete documents | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Add deadlines | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Approve users | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Change user roles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Deactivate users | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage branches | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View audit trail | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Export CSV | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Raise support tickets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

> Roles can only be changed by a Super Admin or Senior Partner via the User Management page.

---

## 24. Platform Admin Panel (Lawravel Staff Only)

The Platform Admin Panel is a special area accessible **only to Lawravel staff** with the `PLATFORM_ADMIN` role. Regular firm users do not have access to this area and will never see it.

This section is included for reference purposes only.

### 24.1 Overview Stats

The dashboard shows platform-wide statistics:
- Total number of firms on the platform
- Total users across all firms
- Total open support tickets
- Other aggregate metrics

### 24.2 Firm Management

A list of all law firms using Lawravel with:
- Firm name and invite code
- Subscription status (Trial, Active, Expired, etc.)
- User count and case count
- **View Details** — opens a drill-down showing the firm's users, branches, and case counts
- **Suspend / Unsuspend** — temporarily lock a firm's access (e.g., for non-payment or a policy violation)

### 24.3 Support Ticket Management

All support tickets raised by all firms are visible here. Platform admins can:
- **Filter** by firm, status (Open, In Progress, Resolved, Closed), and priority
- **View** the full ticket including the user's message
- **Respond** — type a response that will appear in the user's Support page
- **Change status** — update the ticket status (e.g., mark as Resolved or Closed)

When an admin responds to a ticket, the user is notified via an in-app notification and the Support sidebar badge updates to alert them.

---

## 25. Tips & Best Practices

### For Firm Administrators

- **Share the Firm Code securely** — only share it with people who should have access. If you believe the code has been compromised, contact Lawravel support to have it regenerated
- **Approve users promptly** — new staff cannot work until approved. Check the Users page regularly for pending approvals
- **Set up branches early** — if you have multiple offices, create branches before creating cases so you can assign cases to the right location from the start
- **Review the Audit Trail** periodically for any unexpected activity

### For All Staff

- **Set reminders on every deadline** — even if you think you will remember, email reminders are a safety net. Set at least "1 Week Before" and "1 Day Before" for every important deadline
- **Keep document statuses updated** — move documents from Draft → Ready to File → Filed → Served as they progress. This keeps the Filing Tracker accurate and helps the whole team
- **Use the Calendar regularly** — the Calendar gives you a quick visual of what is coming up in the month ahead
- **Use "My Cases" view** — on the Cases page, the "My Cases" tab shows only cases you are assigned to. Use this to focus on your own workload
- **Use Advanced Search** instead of scrolling — if you are looking for a specific document or case, Search is faster than browsing the full list

### For Mobile Users

- The sidebar is hidden on mobile. Tap the **menu icon (≡)** at the top of any page to open it
- All features are available on mobile, though the Analytics and Calendar pages are best viewed on a larger screen

### Keeping Your Account Secure

- Use a **strong, unique password** — at least 12 characters, mixing letters, numbers, and symbols
- Enable **Two-Factor Authentication** for an added layer of protection, especially if you handle sensitive client data
- **Log out** when using shared or public computers
- Never share your password with colleagues — each person should have their own account

### Platform Security Standards

Lawravel is built to enterprise security standards:
- **ISO 27001 Certified Security** — the platform follows internationally recognised information security management practices
- **GDPR & Data Protection Compliant** — your firm's data and your clients' personal data are handled in accordance with data protection regulations

---

*For further assistance, raise a support ticket from the Support section in the platform, or email the Lawravel support team directly.*

*© 2026 Lawravel. All rights reserved.*
