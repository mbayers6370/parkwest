# UI Brief

## Design Goal

Create a mobile-first internal scheduling product that feels clean, premium, and obvious to use. The interface should be straightforward for older users, easy to scan quickly, and aligned with the Parkwest brand rather than generic scheduling software.

The target feeling is:

- simple
- calm
- structured
- polished
- easy to use on a phone in a real work environment

## Primary UI Principles

- Mobile first
- Cards on mobile
- Clear sections on desktop
- Large tap targets
- Minimal typing
- Strong contrast
- Short labels
- Familiar layouts
- One main action per screen when possible

## Brand Direction

Use the Parkwest logo as the stylistic anchor.

Visual character:

- premium but restrained
- operational, not flashy
- brand-aware, not decorative

Avoid:

- bright startup blues and teals as primary branding
- overly soft pastel dashboards
- tiny text
- cluttered admin layouts
- trying to force a dense spreadsheet onto a phone screen

## Color Palette

### Core Brand Colors

- Charcoal: primary text, nav, headers, high-emphasis surfaces
- Neutral White: app background, cards, content areas
- Gold: primary accent, selected states, key actions, important highlights

### Usage Guidance

- Gold should be used as an accent, not the dominant background color
- Charcoal should carry most structural weight
- Neutral white should keep the app open and readable

### Functional Status Colors

Brand colors should not be overloaded for operational status. Use separate status colors when needed:

- Green: approved, present
- Red: call-out, urgent issue
- Amber: warning, pending review
- Blue only if needed for informational states

Color should never be the only signal. Pair with text, icon, or badge labels.

## Typography

### Body

- Inter for body text
- Use normal or medium weights for readability

### Section and Card Titles

- Inter in bold for card titles, section labels, and strong hierarchy

### Page Titles / Brand Titles

- Use a more logo-adjacent serif or display font for top-level page titles only
- This font should echo the Parkwest logo tone without hurting readability
- Keep this usage limited to page headers, login branding, and major section intros

### Typography Rules

- Never use the display font for dense content or small labels
- Maintain generous line height
- Keep text sizes readable by default on mobile

## Layout Rules

### Mobile

Default mobile pattern:

- stacked cards
- top summary card first
- most important action near the top
- bottom navigation or simple tab structure
- avoid horizontal scrolling whenever possible

Good mobile content blocks:

- next shift card
- weekly summary cards
- request status cards
- attendance action cards
- roster cards

### Desktop

Desktop should use:

- clear content sections
- two-column or three-column structure where useful
- a weekly grid for schedule-heavy screens
- side panels or summary panels for quick actions

Desktop can handle denser scheduling views, but should still remain calm and readable.

## Portal-Specific UI Direction

### Dealers

Mobile priority:

- Next Shift
- This Week
- Request Time Off
- Open Shifts
- My Requests

Dealer UI should feel simple and personal, not administrative.

### Floor Operations

Authorized floor operations users need a dual-workspace experience:

- Personal Mode
- On-Floor Mode

This applies only to floor men, floor women, and management. Cage and chip runners stay in the personal portal in the initial version.

#### Floor Personal Mode

Should include:

- next shift
- weekly schedule
- request actions
- personal schedule information

#### Floor On-Floor Mode

Should include:

- who should be here now
- present / absent / late / called out actions
- point and PSL actions
- department filter
- roster generation

The mode switch should be obvious, fast, and always accessible.

### Cage and Chip Runners

Use the personal portal only at first, unless requirements later expand.

### Manager/Admin

Manager UI can be more desktop-oriented, but still needs mobile support for quick approvals and schedule checks.

Desktop priorities:

- schedule import and preview
- requests queue
- staffing visibility
- audit history

## Schedule Display Guidance

The current paper schedule format still matters because it is familiar to staff.

Retain:

- names on the left
- days across the top
- color-coded shifts
- explicit OFF/PTO/RO style statuses

Improve:

- no handwritten overrides
- no ambiguous white-out edits
- clear status badges
- visible timestamped change history

### Mobile Schedule Approach

Do not default to a full compressed weekly spreadsheet on small screens.

Instead prefer:

- daily cards
- expandable week views
- one-day focus with quick week navigation

### Desktop Schedule Approach

Use sectioned layouts with:

- weekly schedule grid
- filters
- summary side panels
- action drawers or modals when needed

## Accessibility and Language Readiness

Because the workforce includes older users and likely mixed language comfort levels:

- use short, literal labels
- avoid slang
- pair icons with text labels
- allow room for longer translated strings
- never rely on subtle visual cues alone

Future-ready for multilingual UI:

- English first
- translation-friendly copy
- reusable label system

## Component Style Guidance

Buttons:

- large enough for easy tapping
- one strong primary button per card or screen when possible

Cards:

- generous padding
- clear title
- concise secondary text
- obvious action placement

Navigation:

- simple labels
- consistent placement
- avoid deep menu nesting

Badges and statuses:

- clear wording
- consistent shape and color logic

## Visual Summary

North star:

Parkwest brand on top, dead-simple workforce tool underneath.
