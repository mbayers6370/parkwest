# Database Schema Draft

## Goal

Define the first implementation-ready database structure for the Parkwest Scheduling System.

This schema follows the product decisions already made:

- role-based workspaces: Personal, On The Floor, Manager/Admin
- schedule imports come in by employee name
- the system operates internally on stable employee IDs
- live floor operations are tracked separately from the published baseline schedule
- important changes must be auditable

This is a practical MVP schema. It is designed to support the first build without overcomplicating the data model.

## Core Modeling Principles

### 1. IDs are the system source of truth

Imported schedules may use employee names, but all actual relationships should resolve to internal employee records.

### 2. Published schedule and live operations are separate

The weekly schedule should remain the official baseline.

Live attendance actions like present, late, called out, points, and PSL should be stored separately so we do not destroy history.

### 3. Permissions should be role-based and workspace-aware

The schema should support:

- personal-only users
- users who also have On The Floor access
- users with Manager/Admin access

### 4. MVP first

Some advanced items like notifications, payroll, and advanced bidding can be layered on later.

## Main Entities

- employees
- employee_aliases
- user_accounts
- roles
- departments
- employee_role_assignments
- employee_department_assignments
- schedule_import_batches
- schedule_weeks
- shift_assignments
- attendance_events
- point_entries
- psl_entries
- leave_requests
- leave_request_decisions
- workspace_access
- audit_logs

## Tables

## 1. employees

Purpose:
- canonical employee record

Fields:

- id
- employee_id
- badge_id
- first_name
- last_name
- preferred_name
- display_name
- status
- employment_type
- seniority_date
- hire_date
- termination_date
- created_at
- updated_at

Notes:

- `employee_id` should be unique
- `display_name` is useful for the UI
- `employment_type` can later help with bidding priority or policy logic

Suggested enums:

- status: `active`, `inactive`, `terminated`, `leave`
- employment_type: `full_time`, `part_time`, `other`

## 2. employee_aliases

Purpose:
- map schedule-import names to employee records

Fields:

- id
- employee_id_fk
- alias_name
- normalized_alias_name
- alias_type
- is_primary
- created_at
- updated_at

Notes:

- one employee can have many aliases
- `normalized_alias_name` supports import matching
- this table is critical because schedule files are name-based

Suggested enums:

- alias_type: `schedule`, `nickname`, `legacy`, `manual`, `imported`

Constraints:

- unique on `employee_id_fk + alias_name`

## 3. user_accounts

Purpose:
- login and account metadata

Fields:

- id
- employee_id_fk
- username
- password_hash
- password_reset_required
- last_login_at
- failed_login_count
- locked_until
- created_at
- updated_at

Notes:

- one employee should usually have one account
- `username` can be employee ID or another stable company login

Constraints:

- unique on `employee_id_fk`
- unique on `username`

## 4. roles

Purpose:
- canonical system roles

Fields:

- id
- role_key
- role_name
- description
- created_at

Seed roles:

- `dealer`
- `cage_staff`
- `chip_runner`
- `floor_staff`
- `manager_admin`

Notes:

- role describes the job/system classification
- workspace access should be handled separately so one role can still map to multiple UI workspaces

## 5. departments

Purpose:
- organizational grouping

Fields:

- id
- department_key
- department_name
- active
- created_at
- updated_at

Suggested seeds:

- `dealers`
- `floor`
- `cage`
- `chip_runners`

## 6. employee_role_assignments

Purpose:
- assign one or more roles to an employee

Fields:

- id
- employee_id_fk
- role_id_fk
- starts_at
- ends_at
- active
- created_at

Notes:

- supports future flexibility if a user changes role or temporarily has elevated access

## 7. employee_department_assignments

Purpose:
- assign one or more departments to an employee

Fields:

- id
- employee_id_fk
- department_id_fk
- is_primary
- starts_at
- ends_at
- active
- created_at

Notes:

- allows for cross-department edge cases later without redesign

## 8. workspace_access

Purpose:
- control which top-level workspaces a user can access

Fields:

- id
- employee_id_fk
- workspace_key
- granted_by_employee_id_fk
- created_at
- revoked_at

Suggested values:

- `personal`
- `on_the_floor`
- `manager_admin`

Notes:

- this cleanly supports the product structure already defined
- all staff should get `personal`
- only floor men, floor women, and management get `on_the_floor`
- only management gets `manager_admin`

Constraint:

- unique active access per `employee_id_fk + workspace_key`

## 9. schedule_import_batches

Purpose:
- track every schedule file upload/import attempt

Fields:

- id
- uploaded_by_employee_id_fk
- original_filename
- file_type
- import_status
- week_start
- week_end
- total_rows
- matched_rows
- unmatched_rows
- ambiguous_rows
- imported_at
- completed_at

Suggested enums:

- import_status: `uploaded`, `processing`, `needs_review`, `ready`, `published`, `failed`

Notes:

- helps with auditability
- supports retry/review flow for name matching

## 10. schedule_import_rows

Purpose:
- store parsed rows from a schedule upload before publish

Fields:

- id
- schedule_import_batch_id_fk
- source_row_number
- source_employee_name
- normalized_source_employee_name
- matched_employee_id_fk
- match_status
- raw_payload_json
- created_at

Suggested enums:

- match_status: `matched`, `unmatched`, `ambiguous`, `ignored`

Notes:

- preserves the original imported row data
- important for admin review before publishing

## 11. schedule_weeks

Purpose:
- top-level weekly schedule record

Fields:

- id
- week_start
- week_end
- status
- source_import_batch_id_fk
- created_by_employee_id_fk
- published_by_employee_id_fk
- created_at
- published_at

Suggested enums:

- status: `draft`, `published`, `archived`

Constraint:

- unique on `week_start`

Notes:

- one schedule week should be the official container for all published assignments for that week

## 12. shift_assignments

Purpose:
- official published schedule assignments

Fields:

- id
- schedule_week_id_fk
- employee_id_fk
- department_id_fk
- shift_date
- start_time
- end_time
- shift_code
- assignment_status
- source_type
- source_import_row_id_fk
- notes
- created_at
- updated_at

Suggested enums:

- assignment_status: `scheduled`, `off`, `pto`, `ro`, `psl`, `open`, `canceled`
- source_type: `import`, `manual`, `override`, `bid_award`, `swap`

Notes:

- this is the baseline schedule record
- do not overwrite baseline history with live operational check-ins

## 13. attendance_events

Purpose:
- live operational record tied to a scheduled assignment when possible

Fields:

- id
- shift_assignment_id_fk
- employee_id_fk
- department_id_fk
- event_status
- note
- recorded_by_employee_id_fk
- recorded_at
- effective_at
- is_current
- created_at

Suggested enums:

- event_status: `present`, `late`, `absent`, `called_out`, `early_off`, `reassigned`

Notes:

- `is_current` makes it easy to query current status
- multiple events may exist for one shift over time
- preserve event history rather than updating a single row in place

## 14. point_entries

Purpose:
- track point-system usage and adjustments

Fields:

- id
- employee_id_fk
- attendance_event_id_fk
- amount
- reason_code
- note
- entered_by_employee_id_fk
- entered_at

Notes:

- keep as a ledger rather than a single balance field
- balances can be computed later or cached separately

## 15. psl_entries

Purpose:
- track PSL usage and adjustments

Fields:

- id
- employee_id_fk
- attendance_event_id_fk
- amount_hours
- reason_code
- note
- entered_by_employee_id_fk
- entered_at

Notes:

- store as hours or the unit your business uses

## 16. leave_requests

Purpose:
- employee-submitted requests such as PTO or similar time off

Fields:

- id
- employee_id_fk
- request_type
- start_date
- end_date
- partial_day_start_time
- partial_day_end_time
- note
- status
- submitted_at
- updated_at

Suggested enums:

- request_type: `pto`, `ro`, `psl`, `unpaid`, `other`
- status: `pending`, `approved`, `denied`, `canceled`

Notes:

- keep the request itself separate from the decision record

## 17. leave_request_decisions

Purpose:
- manager/admin decision metadata for a leave request

Fields:

- id
- leave_request_id_fk
- decided_by_employee_id_fk
- decision
- decision_note
- decided_at

Suggested enums:

- decision: `approved`, `denied`

Notes:

- supports a clean audit trail
- if needed later, this can become a fuller review history table

## 18. open_shifts

Purpose:
- later MVP or phase-two support for bidding/open shift workflows

Fields:

- id
- source_shift_assignment_id_fk
- department_id_fk
- shift_date
- start_time
- end_time
- status
- created_by_employee_id_fk
- created_at
- closed_at

Suggested enums:

- status: `open`, `awarded`, `expired`, `canceled`

Notes:

- can exist in the schema now even if the UI ships later

## 19. open_shift_bids

Purpose:
- later MVP or phase-two bid submissions

Fields:

- id
- open_shift_id_fk
- employee_id_fk
- eligibility_status
- ranking_score
- submitted_at
- awarded_at

Suggested enums:

- eligibility_status: `eligible`, `ineligible`, `pending_review`

## 20. audit_logs

Purpose:
- record important actions across the system

Fields:

- id
- actor_employee_id_fk
- entity_type
- entity_id
- action_key
- before_state_json
- after_state_json
- metadata_json
- created_at

Notes:

- audit logs are essential for schedule edits, attendance changes, request decisions, and imports

## Relationships Summary

- one `employee` to many `employee_aliases`
- one `employee` to one `user_account`
- one `employee` to many `employee_role_assignments`
- one `employee` to many `employee_department_assignments`
- one `employee` to many `workspace_access` rows
- one `schedule_import_batch` to many `schedule_import_rows`
- one `schedule_week` to many `shift_assignments`
- one `shift_assignment` to many `attendance_events`
- one `attendance_event` to many `point_entries`
- one `attendance_event` to many `psl_entries`
- one `employee` to many `leave_requests`
- one `leave_request` to many `leave_request_decisions` if we later allow richer review history

## Recommended Constraints

- `employees.employee_id` unique
- `user_accounts.username` unique
- `employee_aliases.employee_id_fk + alias_name` unique
- `schedule_weeks.week_start` unique
- foreign keys on all `_fk` fields
- indexes on `shift_date`, `week_start`, `employee_id_fk`, `department_id_fk`, `status`, and `workspace_key`

## Recommended Query Priorities

The application will likely need these queries to be fast first:

- get my upcoming shifts
- get my leave requests
- get current floor roster by department and shift
- get current attendance state for a shift
- get unmatched import rows for admin review
- get weekly schedule by department
- get audit history for a record

## Implementation Notes For Prisma

Suggested modeling approach:

- use string enums for status fields
- use `DateTime` for timestamps
- use `DateTime` or `Date` plus time fields depending on timezone strategy
- use JSON fields for raw import payloads and audit snapshots

Important implementation choice:

- `shift_date` should be stored separately from start/end times if schedules are entered by local business date
- this will make weekly schedule views easier and safer than storing only one datetime range

## Seed Data Recommendation

Seed these first:

- roles
- departments
- workspace keys
- baseline request types
- baseline attendance statuses

## MVP Cut Line

Must be implemented in the first build:

- employees
- employee_aliases
- user_accounts
- roles
- departments
- employee_role_assignments
- employee_department_assignments
- workspace_access
- schedule_import_batches
- schedule_import_rows
- schedule_weeks
- shift_assignments
- attendance_events
- point_entries
- psl_entries
- leave_requests
- leave_request_decisions
- audit_logs

Can be scaffolded later or left for phase two:

- open_shifts
- open_shift_bids

## Open Decisions Before Coding

- exact request-type list for launch
- whether PSL should always be stored in hours
- whether points are integers only or can be fractional
- whether floor reassignment needs its own dedicated table later
- whether one employee may hold more than one active department assignment at launch

## Recommendation

Use this schema as the basis for the initial Prisma models, then generate the first migration only after we confirm:

- role names
- workspace access rules
- request type list
- point and PSL units
