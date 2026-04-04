# MVP Requirements

## Goal

Deliver a first version of the Parkwest Scheduling System that replaces the most painful manual workflows while staying compatible with current schedule and staffing practices.

## Primary User Groups

### Dealers

Need to:

- View their schedule
- Request time off
- See request status
- See open shifts they can bid on
- Potentially request a shift swap

### Floor Operations

Need to:

- See who should be on shift right now
- Track who is actually present
- Mark call-outs, absences, lateness, early-off
- Record whether points or PSL were used
- Generate a current roster for operations

Additional note:

- Floor Operations access is limited to floor men, floor women, and management
- Cage and chip runners should use only the personal portal in the initial version

### Manager/Admin

Need to:

- Import employee data
- Import weekly schedule data
- Review and publish schedules
- Review and act on time-off requests
- Review staffing changes and attendance history
- Configure rules and exceptions

## MVP Scope

### In Scope

- Role-based login
- Employee master data import
- Name-to-ID mapping for schedule imports
- Weekly schedule import from spreadsheet
- Weekly schedule publish flow
- Dealer schedule view
- Time-off request submission
- Request review and approval
- Floor attendance tracking
- Points and PSL recording
- Live roster view for floor operations
- Audit log for key actions

### Out of Scope For Initial MVP

- Messaging/chat
- Payroll integration
- Automatic full schedule generation
- Native mobile app
- Complex notification system
- Advanced reporting dashboards

## Key Constraint: Names vs IDs

Managers currently work from schedules organized by employee name, not employee ID. This creates a hard requirement:

- The system must import schedules by employee name
- The database must still use employee IDs as the real identifier

### MVP Requirement

The system must support:

- employee records with employee IDs
- one or more schedule aliases per employee
- import matching by alias
- admin review for unmatched or ambiguous names
- persistent mapping so future imports become easier

## Functional Requirements

### Authentication

- Users must be able to log in with a stable credential
- Employee ID can be used as username if available
- First login should require password reset
- Badge number may be stored, but should not be the only secure auth factor

### Employee Management

- Admin can import employee list from file
- Employee record includes name, employee ID, department, role, status
- Employee may have multiple import aliases
- Admin can activate or deactivate employee records

### Schedule Import

- Admin uploads weekly schedule file
- System parses schedule rows by employee name
- System maps each row to an employee record
- System flags unmatched names before publish
- System allows preview before publish
- Published schedule becomes visible to all permitted users

### Schedule Viewing

- Personal portal users can view only their own schedules
- Floor operations users can view department schedules
- Manager/admin can view all schedules
- Weekly grid should resemble current paper workflow enough to feel familiar
- Authorized floor operations users should be able to switch between personal and on-floor views

### Time-Off Requests

- Dealer can submit request with dates and request type
- Requests appear in manager/admin review queue
- Requests can be approved or denied
- Status is visible to requesting employee

### Attendance Tracking

- Floor operations can mark attendance status for a scheduled person
- Supported statuses should include present, absent, called out, late, early-off
- System should allow note entry for exceptions
- Attendance changes must be timestamped and attributed to the user who made them

### Points and PSL

- Floor operations or authorized managers can record whether points were used
- Floor operations or authorized managers can record PSL usage
- These records should be linked to the attendance event or schedule event when possible

### Live Roster

- Floor operations must be able to see who is scheduled for a current or selected time block
- System should support generating a current roster every two hours or on demand
- Live roster should show schedule plus actual attendance state

### Audit Logging

- The system must record key changes
- At minimum: schedule publish, schedule edits, request approvals, attendance changes, point usage, PSL usage

## Initial Business Rules To Capture

These may change, so they should be documented clearly and later made configurable:

- Shift swap cutoff, possibly four hours before shift start
- Minimum rest window, possibly 9.5 hours
- Shift bidding priority rules
- Department-based visibility and permissions
- Which statuses consume points
- Which statuses qualify for PSL

## Open Questions

- Exact set of request types: PTO, RO, PSL, unpaid, other?
- Should dealers see their current point totals?
- Can floor ops edit published shifts directly, or only live attendance state?
- How should duplicate or similar employee names be resolved operationally?
- Who is responsible for maintaining employee aliases?
- How should multi-department employees be handled?
- Should authorized floor operations users see a direct mode switch, or should the app route them based on last-used workspace?

## Acceptance Criteria For MVP

- An admin can import employees
- An admin can upload a weekly schedule using names
- The system can map schedule rows to employee IDs
- A schedule can be previewed and published
- A dealer can log in and view their schedule
- A dealer can submit a time-off request
- A manager can approve or deny that request
- A floor user can mark attendance and record points or PSL
- The system keeps an audit trail of those actions
