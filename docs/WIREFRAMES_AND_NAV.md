# Wireframes And Navigation

## Goal

Define the first-pass application structure before implementation begins. This document focuses on:

- top-level navigation
- portal entry points
- mobile-first page priorities
- desktop layout sections
- low-fidelity screen structure

The purpose is not visual polish. The purpose is to decide what each user sees, where they go next, and what actions matter most on each screen.

## Top-Level Product Structure

The app should be organized into three main workspaces:

- Personal
- On The Floor
- Manager/Admin

Not every user gets every workspace.

### Access Model

`Dealers`
- Personal only

`Cage`
- Personal only

`Chip Runners`
- Personal only

`Floor Men / Floor Women`
- Personal
- On The Floor

`Management`
- Personal
- On The Floor
- Manager/Admin

## Global Navigation Model

## Mobile

Mobile should prioritize fast access and very shallow navigation.

Recommended navigation pattern:

- bottom navigation for the active workspace
- top workspace switcher only for users with multiple workspaces
- no deep nested menu structure

### Workspace Switcher

Users with more than one workspace should see a clear switcher near the top:

- Personal
- On The Floor
- Admin

This should feel like changing context, not entering a hidden menu.

### Personal Mobile Navigation

Bottom tabs:

- Home
- Schedule
- Requests
- Account

Optional fifth tab later:

- Open Shifts

### On The Floor Mobile Navigation

Bottom tabs:

- Now
- Roster
- Schedule
- Log

### Manager/Admin Mobile Navigation

Bottom tabs:

- Overview
- Requests
- Schedule
- More

Admin mobile should support quick actions, but desktop remains the primary admin experience.

## Desktop

Desktop should use section-based layouts with a left sidebar and page-level content areas.

Recommended structure:

- left sidebar for workspace navigation
- top bar for page title, filters, and workspace switching
- main content area for cards, sections, or grids
- optional right-side summary panel on schedule-heavy pages

## Personal Workspace

## Purpose

The Personal workspace is the self-service experience for all non-manager users and also for floor/management users when acting as employees instead of operators.

## Mobile Entry Screen

`Home`

Priority order:

1. Next Shift card
2. This Week preview
3. Request Time Off action
4. Open Requests status
5. Open Shifts preview if applicable

### Home Card Stack

`Next Shift`
- date
- start/end time
- role or department
- simple status badge

`This Week`
- small list of upcoming days
- tap to full schedule

`Request Time Off`
- primary action button

`My Requests`
- pending/approved/denied summary

`Open Shifts`
- only if enabled for that role

## Personal Screens

### 1. Home

Mobile:
- stacked summary cards

Desktop:
- two-column summary layout

### 2. My Schedule

Mobile:
- default to day and week cards
- allow quick next/previous week navigation
- avoid a compressed spreadsheet layout by default

Desktop:
- weekly sectioned view
- optional grid layout

Key content:

- shift date
- start/end time
- status such as OFF/PTO/RO
- notes if relevant

### 3. Request Time Off

Mobile:
- short form
- large date pickers
- simple request type selector
- optional note field

Desktop:
- same workflow in a wider card or split layout

### 4. My Requests

Mobile:
- list of request cards

Desktop:
- filterable table or card list

Card content:

- request dates
- request type
- status
- decision date

### 5. Open Shifts

Only if included for that role and enabled in that phase.

Mobile:
- stacked shift cards with one primary action

Desktop:
- filterable list with eligibility markers

### 6. Account

- profile basics
- password reset
- language setting later if added

## Personal Desktop Layout

Recommended sections:

- top summary row
- schedule section
- requests section
- quick actions section

## On The Floor Workspace

## Purpose

This is the live operations workspace for floor men, floor women, and management only.

This workspace is not a personal schedule tool. It is an operational staffing tool.

## Mobile Entry Screen

`Now`

Priority order:

1. Current shift selector
2. Who should be here now
3. Attendance action buttons
4. Staffing gaps
5. Fast filters

## On The Floor Screens

### 1. Now

This is the main live operations screen.

Mobile:
- sticky shift/time selector
- stacked roster cards
- fast status action row on each card

Desktop:
- left column roster list
- center live staffing board
- right column summary and alerts

Roster card content:

- employee name
- scheduled time
- current status
- action buttons: present, late, absent, called out
- quick access to points or PSL action

### 2. Roster

Purpose:
- generate the active roster for current or selected block
- support every-two-hours workflow
- allow on-demand generation

Mobile:
- filter bar
- one roster block at a time

Desktop:
- roster list with printable/exportable view later

### 3. Schedule

Purpose:
- view official staffing schedule for the department

Mobile:
- card-based by day or time block

Desktop:
- denser weekly staff grid

### 4. Log

Purpose:
- review recent attendance and status changes

Mobile:
- timestamped activity feed

Desktop:
- filterable log list

### 5. Person Detail Drawer or Modal

Opened from roster or schedule.

Should show:

- employee name
- scheduled shift
- current attendance state
- notes
- point/PSL actions
- recent related changes

This should not require a full separate page at first.

## On The Floor Desktop Layout

Recommended structure:

- top control bar for date, shift, and department
- main staffing section
- roster section
- recent changes / issues section

## Manager/Admin Workspace

## Purpose

Administrative control center for schedule publishing, employee maintenance, approvals, and system oversight.

Desktop is primary here, but mobile should support fast approvals and status checks.

## Admin Screens

### 1. Overview

Primary desktop landing page.

Sections:

- pending requests
- upcoming schedule publish status
- unresolved staffing issues
- recent activity

Mobile:
- card stack of urgent items

### 2. Employees

Purpose:
- manage employee records
- import employee roster
- manage alias mapping

Subsections:

- employee list
- employee detail
- import roster
- alias review queue

### 3. Schedule Import

Purpose:
- upload weekly schedule file
- validate rows
- detect unmatched names
- preview before publish

This is one of the most important admin workflows.

Flow:

1. Upload file
2. Parsing summary
3. Unmatched names review
4. Preview
5. Publish

### 4. Requests

Purpose:
- review time-off requests

Views:

- pending
- approved
- denied
- by week
- by department if needed later

### 5. Schedule Manager

Purpose:
- review published schedule
- make admin adjustments
- inspect staffing by week

### 6. Rules And Settings

Purpose:
- manage configurable business rules

Examples:

- swap cutoff
- rest window
- open shift eligibility rules
- status labels

### 7. Audit Log

Purpose:
- review important system changes

Filters:

- user
- action
- date
- entity type

## Admin Desktop Layout

Recommended sections:

- left sidebar for major areas
- top-level tabs or segmented controls within a page when needed
- tables where appropriate
- cards for summaries and warnings

## Cross-Workspace Interaction Rules

- A workspace switch should preserve user context when possible
- Personal and On The Floor should feel connected but distinct
- On The Floor actions should never be buried inside Personal navigation
- Admin actions should stay separate from operational actions

## Screen Priority Order For Build

Build these screens first:

1. Personal Home
2. Personal Schedule
3. Request Time Off
4. Admin Employee Import
5. Admin Schedule Import
6. On The Floor Now
7. Requests Queue

## MVP Navigation Summary

### Personal

- Home
- My Schedule
- My Requests
- Request Time Off
- Account

### On The Floor

- Now
- Roster
- Schedule
- Log

### Manager/Admin

- Overview
- Employees
- Schedule Import
- Requests
- Schedule Manager
- Rules And Settings
- Audit Log

## Wireframe Notes

This document is intentionally low fidelity. The next level of detail could be:

- screen-by-screen wireframes
- route structure
- component inventory
- role-based navigation matrix
