# Statistics Calendar Refactor Plan

## Purpose

This document describes the planned refactor of the Statistics page so it becomes calendar-first instead of filter-first. It intentionally avoids code-level implementation details and focuses on scope, architecture, sequencing, validation, and unresolved product decisions.

## Current-State Assessment

The current Statistics experience is centered around a single client page that combines:

- year/month filter controls
- an optional advanced date search toggle with exact `from` and `to` inputs
- currency selection and cross-currency inclusion
- statistics fetching
- client-side transaction filtering for the underlying transaction table

The main issues with the current structure are:

- `app/statistics/page.tsx` currently owns too many responsibilities in one component.
- Date filtering is split between month selection and advanced date search, which the new UX is replacing.
- The page eagerly loads profile transactions and derives years, currencies, and the visible transaction list client-side.
- `/api/statistics` only returns aggregate data for a date range; it does not provide month-view daily totals needed by a calendar.
- Guest mode statistics are implemented separately in `services/guestDataService.ts` and will also need parity.

## Refactor Goals

- Remove the existing year/month filter controls from the Statistics page.
- Remove the advanced date search toggle and its exact-date input controls.
- Keep the currency dropdown and the "include other currencies" checkbox above the calendar.
- Introduce a month-view calendar that displays:
  - total expense for each date as a red event
  - total income for each date as a green event
- Allow clicking a calendar event to open a dialog with that date’s underlying transactions.
- Preserve the existing transaction edit flow by allowing the dialog items to route to `/transactions/[id]/edit`.
- Keep the current charts and underlying transaction list, but make them react to a calendar-based date-range selection.
- Query and populate the active month when the calendar month changes.
- Preserve support for ranged statistics, but drive the range from direct calendar interaction instead of separate date inputs.

## Confirmed Product Decisions

- Clicking a calendar event opens a dialog showing only transactions of the clicked event type for that date.
- When `include other currencies` is enabled, transaction lists should display converted values rather than raw original-currency values.
- Changing the visible month does not reset the selected range; the selected range persists until the user selects a new range.
- Currency dropdown options are derived from all currencies available in the active profile.
- Clicking the date background controls range selection, while clicking colored event chips opens the dialog.
- Range highlighting is applied only after the second click completes the range.
- Selected ranges may span multiple months.
- When a selected range spans multiple months, the calendar continues to show one visible month at a time.
- Transactions in the day drilldown dialog are sorted oldest first.
- The underlying transaction table below the charts remains as a full-width table.
- Zero-value calendar events are hidden.
- Month calendar data will come from a dedicated new statistics endpoint.

## Recommended Target Architecture

### 1. Split the Statistics page into focused responsibilities

The current page should be decomposed into smaller responsibilities so UI state and data state are easier to reason about. The refactor should separate:

- filter/header controls
- calendar month state
- selected date-range state
- selected-day dialog state
- aggregate statistics state
- underlying transaction list state

Recommended logical units:

- `StatisticsControls`
- `StatisticsCalendar`
- `StatisticsDayTransactionsDialog`
- `StatisticsSummarySection`
- a page-level coordination layer that owns shared state and URL synchronization

The exact filenames can be decided during implementation, but the responsibility boundaries should be explicit.

### 2. Keep range statistics and month calendar data as separate concerns

The current `/api/statistics` endpoint already fits the chart and summary use case because it accepts an arbitrary `from` and `to` range. That contract should remain the primary source for:

- summary cards
- expense pie chart
- income vs expense bar/histogram

The calendar month view needs additional data that the current endpoint does not provide. The lowest-risk plan is:

- keep `/api/statistics` for selected-range aggregates
- add a dedicated month-calendar statistics endpoint for daily totals within one visible month
- keep `/api/transactions` as the source for transaction lists and day-level drilldown

This avoids overloading the existing dashboard/statistics contract and limits regression risk for current consumers.

### 3. Move from full-profile client-side derivation to query-driven loading

The current page loads profile transactions broadly and derives filters and transaction lists on the client. The refactor should move to query-driven loading:

- month-level aggregate query for the visible calendar month
- selected-range aggregate query for charts and summary
- selected-range transaction query for the list below the charts
- exact-day transaction query for the event dialog

This change keeps the page aligned with the new interaction model and avoids fetching the entire profile history just to render one month.

### 4. Use profile-wide currency availability rather than range-derived currency availability

The current page derives currency options from transactions inside the active date range. That behavior should change.

The refactor should populate the currency dropdown from all currencies available in the active profile, independent of:

- the visible month
- the currently selected range
- whether the current selection contains transactions in that currency

This keeps the control stable while users navigate between months and date ranges.

## Planned Data Model Changes

### Existing range aggregate contract

`/api/statistics` should continue to return range-based aggregate data for:

- summary totals
- tag breakdowns
- selected period metadata
- skipped-currency metadata when conversions are enabled

This keeps the current dashboard and summary visualizations stable.

### New month-calendar aggregate contract

A new month-focused statistics response should support:

- visible month identifier
- daily totals keyed by date
- separate income and expense totals per day
- selected currency metadata
- skipped-currency metadata when conversion is enabled

This endpoint should be driven by:

- `profile`
- visible month
- `currency`
- `includeConverted`

### Transaction queries

The existing `/api/transactions` route should remain the basis for:

- the selected-range transaction table
- the date dialog transaction list

Expected usage:

- selected-range list: `from` = selected start date, `to` = selected end date
- day dialog: `from` = selected date, `to` = selected date

Where currency filtering is applied should be explicit:

- if conversions are disabled, the list should reflect the selected currency only
- if conversions are enabled, the list should reflect converted display values rather than raw original-currency values

This means the implementation will need a clear display strategy so transaction rows, day drilldowns, and aggregate totals stay visually consistent when cross-currency inclusion is enabled.

### Guest mode parity

`services/guestDataService.ts` will need equivalent support for:

- month calendar daily totals
- selected-range aggregates
- day-level transaction drilldown

Guest mode should behave as closely as possible to authenticated mode so the Statistics page does not branch into two separate UX paths.

## Planned UI and Interaction Changes

### 1. Controls area

The top control bar will be simplified to:

- currency dropdown
- include-other-currencies checkbox

The following controls will be removed:

- year dropdown
- month dropdown
- advanced date search switch
- exact `from` and `to` inputs
- reset-range button tied to advanced date search

The calendar itself becomes the primary time-navigation and time-selection surface.

The currency dropdown should remain stable across month and range changes because its options are derived from all currencies available in the active profile.

### 2. Calendar month navigation

The calendar will own a visible month state. When the user navigates to a different month:

- the page will request month aggregate data for that visible month
- the calendar cells will repopulate with daily income/expense totals
- the currently selected range will remain unchanged until the user selects a new range
- the range-driven charts and transaction list will continue to reflect the persisted selected range

The most consistent default is:

- visible month initializes to the current month
- the initial selected range is the full visible month

That preserves the current "show me this month" default while introducing calendar-driven refinement.

### 3. Calendar cell content

Each date cell should support:

- a red expense event showing that date’s total expense
- a green income event showing that date’s total income

If a day has only one side of activity, only one event should render. If a day has no transactions, or if a computed event total is zero, the date cell should remain visually quiet.

### 4. Calendar event click behavior

Clicking an event should open a dialog styled similarly to Google Calendar’s event detail pattern:

- show the selected date
- show only the transactions underlying the clicked event type for that date
- allow clicking a transaction row/item to navigate to its edit page

This dialog should feel like a drilldown, not a second full statistics screen.

The transaction list inside the dialog should be sorted oldest first.

### 5. Calendar range selection behavior

The calendar should replace the advanced date search with direct range picking:

- first date click sets the start date
- second date click sets the end date
- all dates between start and end are highlighted inclusively after the second click completes the range
- if the second click is earlier than the first, the range is normalized
- a third selection should start a new range after the previous one is committed
- the selected range may span across multiple months

Once the range is committed, the following must refresh together:

- summary cards
- pie chart
- income vs expense chart/histogram
- underlying transaction list below the charts

### 6. Event click vs range click separation

The calendar will need clear interaction separation:

- clicking the day body/date should be used for range selection
- clicking an income/expense event should open the dialog

This is important because both interactions live inside the same day cell.

### 7. Multi-month range behavior

Selected ranges are allowed to span multiple months, but the calendar should continue to present one visible month at a time.

This means:

- the selected range can extend beyond the currently visible month
- month navigation should not collapse or reset the selected range
- the calendar should visually reflect the in-month portion of the active range for the currently visible month

### 8. Underlying transaction table

The existing underlying transaction list below the charts should remain as a full-width table after the calendar is introduced.

This preserves the current scanability and keeps the calendar drilldown dialog focused on date-specific inspection rather than replacing the broader ranged transaction table.

## State and URL Strategy

The refactor should simplify URL state instead of expanding it.

Recommended URL parameters:

- visible month
- selected `from`
- selected `to`
- `currency`
- `includeConverted`

The following parameters should be removed from ongoing usage:

- `year`
- `month` as the old dropdown concept
- `advanced`

Benefits of keeping the new range in the URL:

- refresh-safe statistics state
- deep-linking to a selected month/range/currency combination
- easier regression testing

## Component and File Impact

The implementation will most likely touch at least these areas:

- `app/statistics/page.tsx`
- `app/api/statistics/route.ts` or a new sibling route for calendar data
- `services/guestDataService.ts`
- `utils/api.ts`
- `utils/useApi.ts`
- `types/index.ts`
- Cypress statistics coverage in `cypress/e2e/phase4-statistics.cy.ts`
- design documentation in `design/ui/statistics.md`
- API documentation in `design/ui/api/statistics.md` and any new endpoint document

## Delivery Phases

### Phase 1. Stabilize the page structure

- Extract the current statistics page into smaller page-level sections.
- Remove the obsolete date filter UI from the page layout.
- Preserve current charts and transaction list while the calendar is introduced.

### Phase 2. Introduce month aggregate support

- Add the month calendar aggregate API contract.
- Add equivalent guest-mode support.
- Extend shared types and API helpers.
- Ensure active-month fetching works independently of selected-range fetching.

### Phase 3. Add calendar rendering

- Render a month-view calendar on the Statistics page.
- Populate each visible date with expense and income events.
- Implement visible-month change handling and loading states.

### Phase 4. Add range-selection behavior

- Replace old advanced date search behavior with direct calendar range selection.
- Drive charts and the underlying transaction list from the selected range.
- Ensure URL state remains in sync.

### Phase 5. Add day drilldown dialog

- Add the Google Calendar-like transaction dialog.
- Fetch the date’s transactions when an event is clicked.
- Preserve navigation to the transaction edit page from dialog entries.

### Phase 6. Regression hardening

- Validate authenticated and guest mode behavior.
- Verify empty states, loading states, and currency conversion edge cases.
- Update Cypress coverage for the new calendar-first workflow.
- Update design and API documentation.

## Risks and Mitigations

### Risk: Interaction complexity inside calendar cells

Range selection and event drilldown both rely on clicking inside the same day cell.

Mitigation:

- define separate click targets for day selection vs event drilldown
- explicitly test both desktop and mobile interaction patterns

### Risk: Currency conversion semantics become unclear in drilldown lists

Aggregates and transaction lists will be shown in the selected currency when conversion is enabled, while the source records may belong to multiple currencies.

Mitigation:

- consistently display converted values in both the table and the dialog when conversion is enabled
- keep labels explicit whenever converted totals are shown

### Risk: Month navigation and selected range can drift out of sync

A user may select a range, then move to another month while the selected range persists outside the visible month.

Mitigation:

- keep month navigation and selected range as separate but synchronized states
- reflect the persisted range consistently in the URL and in the currently visible month

### Risk: Regressions in dashboard statistics or current consumers

The dashboard also uses `/api/statistics`.

Mitigation:

- avoid breaking the current range aggregate contract
- prefer adding a dedicated month endpoint instead of overloading the existing response shape

### Risk: Guest mode diverges from authenticated mode

Guest mode currently mirrors statistics logic separately.

Mitigation:

- update guest-mode statistics in the same refactor
- cover both flows in manual validation and automated tests where practical

## Test Plan

### API validation

- verify selected-range statistics still return correct totals
- verify month calendar endpoint returns correct daily totals
- verify conversion-enabled responses report skipped currencies consistently
- verify day-level and range-level transaction queries remain inclusive and date-correct

### UI validation

- initial load shows current month data
- month navigation refreshes calendar data
- clicking a start date and end date updates the highlighted range after the second click
- charts and transaction list update after range selection
- clicking an expense or income event opens the dialog
- the event dialog shows only transactions for the clicked type on that date
- the event dialog sorts transactions oldest first
- clicking a transaction in the dialog routes to the edit page
- empty states render correctly for months with no data
- conversion toggle updates both calendar totals and range summaries
- conversion-enabled transaction displays use converted values
- multi-month ranges remain active while the calendar continues to show one visible month at a time

### Regression validation

- dashboard statistics remain functional
- existing statistics summary logic still works for selected ranges
- guest mode produces the same visible behavior

## Remaining Open Questions

No unresolved product questions remain from the current scope. Additional implementation questions may still surface during the build, but the primary UX and data-behavior decisions are now defined in this plan.
