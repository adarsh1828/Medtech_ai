# Operating the live OPD tracker

The cabin assistant operates the queue. The doctor does not need to start, pause,
resume or advance the tracker. Prescription issuance is separate from physical
patient movement.

## Start a shift

1. Sign in as an admin and open **OPD Assistant Desk**.
2. Select the doctor and session: Morning contains AM bookings; Afternoon &
   evening contains PM bookings. Sessions use the hospital date in Asia/Kolkata.
3. Assign a primary assistant and, preferably, a different backup. Existing
   hospital staff and nurse accounts can be assigned. Admins can override actions.
4. The assigned assistant signs in, opens the desk, selects the doctor, and presses
   **Take control** followed by **Start OPD**. Staff sessions open at the desk by
   default. A backup takeover immediately revokes the previous operator's control.

## Normal visit

- Reception books a registered patient from Appointments. Online booking alone
  does not mean the patient has arrived.
- On arrival, the assistant presses **Check in**. Only checked-in patients can be
  called. The waiting list shows the actual serving order, not token sorting.
- Press **Call patient**, then **Patient In** when the patient enters the cabin.
  **Recall patient** repeats the call without advancing the queue.
- Press **Patient Out / Visit finished** only after the visit actually finishes.
- A doctor can issue the prescription during consultation or after the visit.
  Saving a prescription does not advance the queue; a finished visit does not
  imply that its prescription has been issued.

## Doctor leaves unexpectedly

Press **Doctor unavailable / Pause now** immediately. The internal reason and
estimated return are optional. Public displays show only temporary unavailability.
The ongoing patient is preserved, consultation duration stops accumulating, ETA
is hidden and further calls/entry/completion are blocked. Check-ins and skipped
patient returns can still be recorded. Press **Doctor returned / Resume** only
after confirming the doctor's return. A return estimate never automatically
restarts OPD. A long consultation prompts the assistant to verify availability;
it never automatically completes a patient or infers that the doctor has left.

## Skipped patient returns

**Skip** keeps the appointment and original token in a separate list. When the
patient returns, press **Patient returned**. The running consultation is not
interrupted. The returned patient follows one regular waiting patient; multiple
returning patients retain their return order with regular patients between them
where possible. For example, current 109 and waiting 110,111,112 becomes
109 → 110 → returned 108 → 111 → 112. No token is renumbered. An assigned nurse or
admin can make a priority override with a recorded reason.

## End a session

Finish the active visit or skip a called absent patient before closing. Closed
sessions cannot call, check in or reinsert patients. Pending visits remain visible.
Reception can cancel the old visit and book the agreed replacement doctor/date/
session. Transfer is never automatic. Morning and afternoon sessions cannot call
two patients for the same doctor on the same day simultaneously.

## Hall TV and patient views

Open **Live OPD Hall Display**, choose the session, then **Create read-only TV
link** and **Open dedicated TV display**. The dedicated page has no staff controls
or inactivity logout. Links expire at hospital midnight and allow only public
token reads. Do not put a normal admin workstation on an unattended TV.

Patient and TV views refresh approximately every six seconds. They show doctor
availability, serving order and connection errors. Patients additionally see
their own appointment and an approximate wait range once checked in and OPD is
running. Other patients' names and clinical details are excluded from tracker
responses. A lost connection preserves the last display with an outdated-data
warning; failed writes must be refreshed and retried. Queue actions are never
queued offline.

## Storage, deployment and verification

- Local SQLite persists the queue in `medtech.db`. OPD tables are added
  non-destructively at server initialization; existing appointments are imported
  into their doctor/date/session on first read. Existing appointment status CHECK
  constraints do not need rebuilding.
- Vercel/serverless requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. The server
  refuses an ephemeral in-memory production database. Existing cloud configuration
  has not been changed or deployed by this implementation.
- Local and cloud mutations use database transactions. Session versions reject
  stale updates; a database uniqueness rule permits one called/in-cabin patient
  per doctor/day. Assignment changes, takeovers and queue actions are audited.
- Run `npm test` in `backend/` for isolated in-memory database and HTTP integration
  tests. They never use the real hospital database or cloud credentials.
- Run `npm run build` and `npm run lint` in `frontend/`. Use Node 20.19+ or 22.12+
  as required by the frontend toolchain.
