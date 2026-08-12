# Plan 1 — Cumulative Balance Line Chart on the Statistics Page

## Goal

Add a line chart to `/statistics` plotting **cumulative balance (y)** against **date (x)**, with
two date selectors that control the visible window.

## Decisions (confirmed)

| Question | Decision |
|---|---|
| Baseline | **True running balance** — the line starts at the net of *all* transactions occurring before the `from` date, so it reads as an actual account balance, not a period delta. |
| Date selectors | **Reuse the existing calendar range** — the two pickers read/write `selectedRange` (`from`/`to`), so they stay in sync with the calendar highlight, the summary cards, the pie/bar charts, and the transactions table. |
| Filters applied | **Currency + `includeConverted`** only. The tag filter is deliberately **not** applied — a tag-filtered "balance" is a partial balance and would be misleading. |
| Granularity | **One point per day** across the whole range; days with no transactions carry the previous balance forward (flat segments). |

## Key insight: no API changes needed

[app/statistics/page.tsx:380-430](app/statistics/page.tsx#L380-L430) already loads
`summaryTransactions` — **every** transaction for the active profile in the selected currency,
with `displayCurrency` and `includeConverted` applied, and **no date filter**.

[app/api/transactions/route.ts:113-120](app/api/transactions/route.ts#L113-L120) confirms that
omitting `limit` returns the full set (no default cap), so this array is the complete history.

That is exactly the input a true running balance needs. The whole feature is derivable client-side
from state that already exists — **no new endpoint, no new fetch, no schema change**.

## Work items

### 1. `components/CumulativeBalanceLine.tsx` (new)

Presentational only, mirroring [components/IncomeExpenseBar.tsx](components/IncomeExpenseBar.tsx)
(`'use client'`, MUI `Paper` shell, recharts `ResponsiveContainer`).

```ts
interface CumulativeBalanceLineProps {
  data: { date: string; balance: number }[]  // date = YYYY-MM-DD, balance in major units
  currency: string
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  isLoading?: boolean
  height?: number
}
```

Contents:
- Header row: title `Cumulative Balance` + the two `DatePicker`s
  ([components/DatePicker.tsx](components/DatePicker.tsx), already `YYYY-MM-DD` in/out) laid out
  `direction={{ xs: 'column', sm: 'row' }}` so they stack on mobile.
- `LineChart` with `CartesianGrid`, `XAxis dataKey="date"`, `YAxis`, `Tooltip`, and a single
  `Line type="monotone" dataKey="balance" dot={false}`.
- `ReferenceLine y={0}` so a negative balance is visually obvious.
- Y-axis and tooltip formatted with the same `Intl.NumberFormat` currency helper used in
  `IncomeExpenseBar`; x-axis ticks formatted `MMM d` (add year when the range spans one).
- Thin ticks on long ranges: pass `interval="preserveStartEnd"` and `minTickGap={32}` rather than
  down-sampling the data, so the line itself stays daily.

### 2. Series computation in `app/statistics/page.tsx`

Add one `useMemo` next to the existing `yearSummaryOptions` / `monthSummaryOptions` memos
([app/statistics/page.tsx:436-500](app/statistics/page.tsx#L436-L500)):

```
cumulativeBalanceSeries = useMemo(() => {
  1. signed(t) = (t.type === 'income' ? +1 : -1) * getDisplayAmountMinor(t)
  2. openingMinor = sum of signed(t) for all summaryTransactions with t.occurredAt < range.from
  3. deltaByDate  = Map<YYYY-MM-DD, minor> for transactions within [from, to]
  4. walk day-by-day from `from` to `to` (date-fns eachDayOfInterval on parseISO'd bounds),
     running += deltaByDate.get(day) ?? 0, push { date: day, balance: running / 100 }
}, [summaryTransactions, selectedRange.from, selectedRange.to])
```

Notes:
- `occurredAt` is already a plain `YYYY-MM-DD` string
  ([app/api/transactions/route.ts:47](app/api/transactions/route.ts#L47)), so lexicographic
  string comparison is a safe and timezone-proof date comparison — no `Date` parsing in the
  hot loop.
- `getDisplayAmountMinor` ([app/statistics/page.tsx:94-96](app/statistics/page.tsx#L94-L96))
  already resolves converted vs. raw amounts, so `includeConverted` is handled for free.
- Guard the day-walk: if the range spans more than ~2000 days, fall back to plotting only the
  range endpoints plus transaction days, to avoid a pathological point count.

### 3. Two date selectors wired to `selectedRange`

Handlers on the page, passed down to the chart:

```
handleBalanceFromChange(value) -> setSelectedRange(normalizeRange(value, selectedRange.to))
handleBalanceToChange(value)   -> setSelectedRange(normalizeRange(selectedRange.from, value))
```

`normalizeRange` ([app/statistics/page.tsx:82-84](app/statistics/page.tsx#L82-L84)) already
swaps inverted bounds, so picking a `from` after the `to` self-corrects instead of erroring.

Because these write `selectedRange`, three existing behaviours come along automatically:
- the URL sync effect ([app/statistics/page.tsx:257-295](app/statistics/page.tsx#L257-L295))
  persists `from`/`to`, so the chart window is shareable/reloadable — **no new URL params**;
- `loadRangeData` re-runs, refreshing the summary cards, pie, bar, and transactions table;
- the calendar's range highlight updates.

Also clear the in-progress calendar click state when a picker is used —
`setPendingRangeStart(null)` and `setHasCommittedRangeSelection(true)` — so
`selectionStatusText` ([app/statistics/page.tsx:847-857](app/statistics/page.tsx#L847-L857))
doesn't keep saying "Pick end date".

### 4. Placement and lazy loading

Register alongside the other two charts at
[app/statistics/page.tsx:48-68](app/statistics/page.tsx#L48-L68):

```ts
const CumulativeBalanceLine = dynamic(
  () => import('@/components/CumulativeBalanceLine').then((m) => ({ default: m.CumulativeBalanceLine })),
  { ssr: false, loading: () => <ChartSkeleton height={380} /> }
)
```

Render it **above** the pie/bar `Grid` at
[app/statistics/page.tsx:1030-1037](app/statistics/page.tsx#L1030-L1037), full width
(`Grid size={{ xs: 12 }}`), inside the existing `AnimatedSection delay={40}`.

Rendering condition — the chart deliberately does **not** sit behind the `hasRangeData` guard.
A range with no transactions still has a meaningful flat balance line carried in from history, so:

- render whenever `currency` is set and there is no `rangeError`;
- pass `isLoading={isLoadingSummaryTransactions}` and show the skeleton while the history loads
  (note: this is a *different* loading flag from the `isLoadingRange` one gating the other charts);
- if `summaryTransactions` is empty after loading, render the chart's own inline empty message
  rather than the page-level `EmptyState`.

This means restructuring the `AnimatedSection delay={40}` block slightly: lift the line chart out
of the `!hasRangeData ? <EmptyState/> : <>…</>` ternary at
[app/statistics/page.tsx:1013-1054](app/statistics/page.tsx#L1013-L1054) so it renders in both
branches.

## Files touched

| File | Change |
|---|---|
| `components/CumulativeBalanceLine.tsx` | **new** — chart + the two date pickers |
| `app/statistics/page.tsx` | series `useMemo`, two range handlers, `dynamic()` import, render slot + ternary restructure |

No changes to `types/index.ts`, `utils/api.ts`, any API route, or the Prisma schema.

## Verification

1. `npm run type-check` and `npm run lint`.
2. `npm run dev:local`, open `/statistics`:
   - line starts at the correct pre-range opening balance (cross-check against the transactions
     list for dates before `from`);
   - moving either picker updates the calendar highlight, the summary cards, and the URL;
   - a range with zero transactions renders a flat line, not an empty state;
   - a range whose start predates every transaction starts the line at 0;
   - switching currency and toggling "include converted" both re-scale the line;
   - selecting tags leaves the line unchanged (by design) — worth a caption on the chart saying
     the balance ignores tag filters, so the behaviour doesn't look like a bug.
3. Mobile width: pickers stack, chart doesn't overflow its `Grid` (`minWidth: 0` is already set on
   the surrounding grid items).

## Open follow-ups (not in scope)

- A "reset to current month" shortcut next to the pickers.
- Brush/zoom on the line for multi-year ranges.
