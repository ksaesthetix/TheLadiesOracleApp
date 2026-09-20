import { useMemo } from 'react';
import { useNatalChart } from './useNatalChart';
import { computeWeek, WeekOutlook } from '../lib/astrology/week';
import { computeCycles, CycleWindow } from '../lib/astrology/cycles';

/** The week ahead against the signed-in user's chart; null until the chart is ready. */
export function useWeek(days = 7): WeekOutlook | null {
  const { state } = useNatalChart();
  const chart = state.status === 'ready' ? state.chart : null;
  // Recompute when the chart or the calendar day changes.
  const dayKey = new Date().toDateString();
  return useMemo(() => (chart ? computeWeek(chart, new Date(), days) : null), [chart, days, dayKey]);
}

/** Life-cycle windows (Saturn return etc.) for the signed-in user; null until the chart is ready. */
export function useCycles(lookBackYears = 2, lookAheadYears = 12): CycleWindow[] | null {
  const { state } = useNatalChart();
  const chart = state.status === 'ready' ? state.chart : null;
  const dayKey = new Date().toDateString();
  return useMemo(() => (chart ? computeCycles(chart, new Date(), lookBackYears, lookAheadYears) : null), [chart, lookBackYears, lookAheadYears, dayKey]);
}
