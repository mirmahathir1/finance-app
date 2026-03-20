# Statistics Calendar Navigation Plan

## Goal

Update the statistics page calendar header so it behaves like a directory-style path:

`Calendar > 2026 > March`

The path should let the user move between three calendar navigation levels without leaving the statistics page.

## Feature Scope

This feature adds hierarchical navigation for the statistics calendar area:

1. `Calendar` level
2. `Year` level
3. `Month` level

The existing day-by-day month calendar remains the final drill-down view.

## Expected User Experience

### 1. Breadcrumb-style path

- Replace the separate month and year picker controls with a directory-style path.
- The path reflects the currently selected month view, for example:
  `Calendar > 2026 > March`
- Each segment acts like a navigation control.

### 2. Calendar root view

- When the user selects `Calendar`, the statistics page shows a grid of years.
- Each year item displays:
  - total income for that year
  - total expense for that year
- Selecting a year opens the month grid for that year.

### 3. Year view

- When the user selects `2026` from the breadcrumb or from the year grid, the statistics page shows the months for that year.
- Each month item displays:
  - total income for that month
  - total expense for that month
- Selecting a month opens the existing month calendar view for that month.

### 4. Month view

- When the user selects a month, the existing calendar month grid is shown.
- The breadcrumb reflects the selected path, for example:
  `Calendar > 2026 > March`
- Daily cells continue to show per-day income and expense information.
- Existing day selection and transaction drill-down behavior should remain available in this view.

## Behavior Rules

- The navigation should feel like drill-down and drill-up within the same statistics page.
- The current selected month determines the active year and month shown in the breadcrumb.
- Clicking `Calendar` always returns to the year grid.
- Clicking a year always returns to the month grid for that year.
- Clicking a month always returns to the day calendar for that month.
- Currency selection and the "Include other currencies" toggle should apply consistently across year, month, and day views.
- Empty states should remain understandable at each level when no activity exists for the selected filters.

## Feature Specification Notes

- Year summaries should represent full-year totals.
- Month summaries should represent full-month totals within the selected year.
- Day summaries should continue to represent totals for individual dates in the selected month.
- Summary values shown in the year grid and month grid should use the same currency and conversion rules as the existing statistics page.
- The feature should work on both mobile and desktop layouts.
- The new navigation should remain compatible with the statistics page’s existing filters, selected range behavior, and deep-linking expectations.

## Acceptance Criteria

- The month/year header is replaced with a breadcrumb-style path.
- Selecting `Calendar` shows years with income and expense totals.
- Selecting a year shows months with income and expense totals.
- Selecting a month shows the existing month calendar.
- Selecting the year segment from `Calendar > 2026 > March` returns to the month grid for `2026`.
- Selecting the `Calendar` segment from `Calendar > 2026 > March` returns to the year grid.
- The selected currency and conversion setting affect all displayed totals consistently.
- Existing day-level interactions still work in the month calendar view.

## Open Questions

1. Should the year grid show only years that contain transactions, or should it also include empty years around the current selection?
2. In the year grid and month grid, should periods with no activity be shown with zero totals, or hidden entirely?
3. Should the previous/next arrow navigation stay available only in month view, or also support moving between years and between months-grid years?
4. Should the URL continue to store only the selected month, or should it also store which level is currently open (`Calendar`, year grid, or month calendar)?
5. When the user changes currency or conversion settings while viewing the year grid or month grid, should the page keep the current level open or reset back to the month calendar?
6. Confirm the label text: should the breadcrumb use `Calendar` or `Calender`? The requested examples use `Calender`, but the component and page currently use `Calendar`.
