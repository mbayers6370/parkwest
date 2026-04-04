# Product Blueprint

## Product Summary

Parkwest Scheduling System is a role-based internal operations platform for schedule publishing, live floor staffing, attendance tracking, and request management.

The first version should solve the core operational pain:

- printed schedules
- handwritten edits
- paper requests
- no centralized history

## Role Model

### Dealer

Permissions:

- View own schedule
- Submit time-off requests
- View request history
- View eligible open shifts
- Bid on open shifts

### Floor Operations

Permissions vary by department:

- View department schedule
- View live staffing board
- Mark attendance status
- Record points, PSL, early-off
- Generate operational roster

Special product note:

- Floor Operations access is limited to floor men, floor women, and management
- Cage and chip runners should remain personal-portal-only in the first version
- Authorized floor operations users should have access to both personal and on-floor workspaces

### Manager/Admin

Permissions:

- Full schedule visibility
- Employee import and maintenance
- Schedule import and publishing
- Request approval
- Rule management
- Reporting and audit review

## Core Workflows

### 1. Employee Import

1. Admin uploads employee roster file
2. System creates or updates employee records
3. Admin reviews missing or duplicate records
4. System stores employee IDs and known aliases

### 2. Weekly Schedule Import

1. Admin uploads schedule spreadsheet
2. System parses employee names and daily assignments
3. System matches imported names against employee aliases
4. Unmatched rows are flagged for review
5. Admin previews and confirms publish

### 3. Published Schedule

Once published:

- Dealers see personal assignments
- Floor operations sees team schedule
- Managers see global view

Published schedule should remain preserved as the official baseline.

### 4. Live Operations

Floor operations staff can:

- mark present
- mark absent
- mark called out
- mark late
- mark early-off
- record points or PSL

These actions should update live operational visibility without destroying published history.

### 5. Time-Off Requests

1. Dealer submits request
2. Request is routed to manager/admin queue
3. Manager approves or denies
4. Decision is stored and visible to the employee

### 6. Open Shift / Bidding Flow

Later MVP extension or early phase-two feature:

1. Shift becomes available
2. Eligible employees can view it
3. System screens for simple eligibility rules
4. Manager selects or system ranks candidates

## Data Model Draft

### employees

- id
- employee_id
- badge_id
- first_name
- last_name
- preferred_name
- role
- department
- status
- seniority_date

### employee_aliases

- id
- employee_id
- alias_name
- alias_type

### accounts

- id
- employee_id
- username
- password_hash
- password_reset_required
- last_login_at

### schedule_weeks

- id
- week_start
- week_end
- status
- imported_by
- published_by
- published_at

### shift_assignments

- id
- employee_id
- schedule_week_id
- shift_date
- start_time
- end_time
- shift_code
- department
- assignment_status
- import_source

### attendance_events

- id
- employee_id
- shift_assignment_id
- status
- note
- recorded_by
- recorded_at

### point_entries

- id
- employee_id
- attendance_event_id
- amount
- reason
- entered_by
- entered_at

### psl_entries

- id
- employee_id
- attendance_event_id
- amount
- reason
- entered_by
- entered_at

### leave_requests

- id
- employee_id
- request_type
- start_date
- end_date
- note
- status
- submitted_at
- reviewed_by
- reviewed_at

### audit_logs

- id
- actor_employee_id
- entity_type
- entity_id
- action
- before_state
- after_state
- created_at

## Page Structure Draft

### Dealer Portal

- Dashboard
- My Schedule
- Request Time Off
- My Requests
- Open Shifts
- Account Settings

### Floor Operations Portal

- Personal Mode
- On-Floor Mode
- Live Board
- Department Schedule
- Attendance Actions
- Roster Generator
- Change Log

Floor-specific mode behavior:

- Personal Mode should look and feel similar to a simplified employee portal
- On-Floor Mode should prioritize live staffing, attendance, and roster actions
- Mode switch should be obvious and always available for authorized floor operations users

### Manager/Admin Portal

- Admin Dashboard
- Employees
- Schedule Import
- Schedule Preview
- Requests Queue
- Rules and Settings
- Reports
- Audit Log

## UI Notes

The paper sheet format shown during planning is important context. The digital schedule should keep some familiar structure:

- names on the left
- days across the top
- color-coded shifts
- visible OFF/PTO/RO style states

But handwritten overrides should be replaced with explicit change states, notes, and timestamps.

Layout direction:

- mobile first
- card-based layouts on phone
- section-based layouts on desktop
- avoid dense spreadsheet behavior on mobile
- reserve full weekly grid density mainly for larger screens

## Architecture Recommendation

Suggested stack for implementation:

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- component library for admin workflows

## MVP Success Definition

The MVP is successful when:

- Managers can publish a weekly schedule from existing schedule files
- Dealers can reliably view their schedules
- Floor operations can track live attendance digitally
- Time-off requests are no longer paper-based
- Important changes are traceable through audit history

## Build Priority

1. Auth and role model
2. Employee import and alias mapping
3. Schedule import and publish flow
4. Dealer schedule view
5. Time-off request flow
6. Floor attendance and roster view
7. Audit logging
