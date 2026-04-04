# Parkwest Scheduling System

Internal workforce scheduling and floor-operations platform for Parkwest. The goal is to replace printed weekly schedules, handwritten edits, and paper time-off requests with a centralized web application.

## Purpose

This project is intended to support three primary user groups:

- Dealers
- Personal Staff Portal
- Floor Operations
- Manager/Admin

The application will become the source of truth for:

- Weekly schedules
- Live attendance and call-outs
- Time-off requests
- Point and PSL tracking
- Open shift bidding
- Operational roster generation

## Current Business Reality

Today, schedules are distributed as printed sheets organized by employee name. Supervisors make live changes by handwriting on top of the printed schedule. Time-off requests are handled on paper. There is no centralized digital workflow.

That means the system must support a realistic transition path:

- Managers may continue using name-based Excel schedules at first
- The app must map schedule names to internal employee records
- The database should still use stable employee IDs as the real identifier

## Product Vision

Build a role-based internal web app that separates:

1. Published schedule
2. Live operational changes
3. Request and approval history

This separation is critical because the current paper process mixes all three together.

## User Portals

### 1. Dealer Portal

- View personal schedule
- Submit time-off requests
- View request status
- View eligible open shifts
- Bid on shifts
- Request swaps if rules allow

### 2. Floor Operations Portal

Restricted operational workspace for floor men, floor women, and management only.

- View live staffing board
- See who is scheduled right now
- Mark present, absent, late, or called out
- Record points, PSL, and early-off usage
- Reassign staffing in real time
- Generate active rosters every two hours or on demand

### 3. Manager/Admin Portal

- Import employee records
- Import weekly schedules
- Review and publish schedules
- Review time-off requests
- Manage open shifts
- Configure business rules
- Review reports and audit history

## Core MVP Principles

- Keep the first release simple and operationally useful
- Preserve compatibility with existing schedule workflows
- Use audit logging for every important change
- Support names for import, IDs for system identity
- Build rules as configurable settings where possible

## Document Map

- [README.md](/Users/matthewbayers/Desktop/Parkwest/README.md): project overview
- [docs/MVP_REQUIREMENTS.md](/Users/matthewbayers/Desktop/Parkwest/docs/MVP_REQUIREMENTS.md): functional requirements and MVP scope
- [docs/PRODUCT_BLUEPRINT.md](/Users/matthewbayers/Desktop/Parkwest/docs/PRODUCT_BLUEPRINT.md): roles, workflows, and data model draft
- [docs/UI_BRIEF.md](/Users/matthewbayers/Desktop/Parkwest/docs/UI_BRIEF.md): visual direction, layout rules, and mobile-first UI guidance
- [docs/WIREFRAMES_AND_NAV.md](/Users/matthewbayers/Desktop/Parkwest/docs/WIREFRAMES_AND_NAV.md): page map, navigation model, and low-fidelity screen structure
- [docs/DATABASE_SCHEMA_DRAFT.md](/Users/matthewbayers/Desktop/Parkwest/docs/DATABASE_SCHEMA_DRAFT.md): table design, relationships, and implementation notes

## Suggested Build Order

1. Finalize requirements and terminology
2. Define database schema
3. Scaffold app with auth and roles
4. Build employee import and name-mapping flow
5. Build schedule import and publish flow
6. Build employee and floor views
7. Add requests, attendance, and audit history

## Status

Planning phase. No application code has been started yet.
