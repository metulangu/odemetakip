import React, { useState, useMemo } from 'react';
import { useFinance, AVAILABLE_YEARS } from '../context/FinanceContext.tsx';
import { 
  formatCurrency, 
  calculateMoM, 
  calculateYoY, 
  MONTH_NAMES_SHORT_TR, 
  MONTH_NAMES_TR,
  getDaysUntilDue
} from '../utils/finance.ts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart2, 
  Activity, 
  CheckSquare, 
  Square, 
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Check,
  CalendarRange,
  Sparkles,
  Sliders
} from 'lucide-react';

type HorizonMode = 'single' | 'multi';
type MultiYearChartType = 'yearly_bars' | 'monthly_overlay' | 'category_trend';
type MultiYearPreset = 'last_2' | 'last_3' | 'last_5' | 'all' | 'custom';

const YEAR_COLORS: Record<number, { bg: string; text: string; fill: string; border: string }> = {
  2022: { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', fill: '#06b6d4', border: 'border-cyan-500' },
  2023: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', fill: '#f59e0b', border: 'border-amber-500' },
  2024: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', fill: '#3b82f6', border: 'border-blue-500' },
  2025: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', fill: '#10b981', border: 'border-emerald-500' },
  2026: { bg: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', fill: '#6366f1', border: 'border-indigo-600' },
  2027: { bg: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400', fill: '#9333ea', border: 'border-purple-600' },
  2028: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', fill: '#f43f5e', border: 'border-rose-500' },
};

export const AnalyticsView: React.FC = () => {
  const { items, categories, entries, selectedYear, setSelectedYear } = useFinance();

  // Horizon Mode: Single Year (12 months drilldown) vs Multi-Year Comparison
  const [horizonMode, setHorizonMode] = useState<HorizonMode>('multi');

  // Multi-Year settings
  const [multiYearPreset, setMultiYearPreset] = useState<MultiYearPreset>('last_5');
  const [selectedMultiYears, setSelectedMultiYears] = useState<number[]>([2022, 2023, 2024, 2025, 2026]);
  const [multiChartType, setMultiChartType] = useState<MultiYearChartType>('yearly_bars');
  const [hoveredMultiYear, setHoveredMultiYear] = useState<number | null>(null);
  const [hoveredOverlayMonth, setHoveredOverlayMonth] = useState<number | null>(null);

  // Single-Year settings
  const [chartType, setChartType] = useState<'bar' | 'area' | 'donut'>('bar');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Shared Filters
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(['ALL']);
  const [statusFilter, setStatusFilter] = useState<'PAID_ONLY' | 'ALL'>('PAID_ONLY');

  // Active items to calculate
  const activeItems = useMemo(() => {
    if (selectedItemIds.includes('ALL')) {
      return items.filter(i => i.isActive);
    }
    return items.filter(i => i.isActive && selectedItemIds.includes(i.id));
  }, [items, selectedItemIds]);

  const isSingleItemMode = !selectedItemIds.includes('ALL') && selectedItemIds.length === 1;
  const singleSelectedItem = isSingleItemMode ? activeItems[0] : null;

  // Handler for Quick Focus Dropdown
  const handleQuickSelect = (value: string) => {
    if (value === 'ALL') {
      setSelectedItemIds(['ALL']);
    } else {
      setSelectedItemIds([value]);
    }
  };

  // Toggle item in multi-select checkboxes
  const handleToggleItem = (itemId: string) => {
    if (itemId === 'ALL') {
      setSelectedItemIds(['ALL']);
      return;
    }

    let next = selectedItemIds.filter(id => id !== 'ALL');
    if (next.includes(itemId)) {
      next = next.filter(id => id !== itemId);
      if (next.length === 0) next = ['ALL'];
    } else {
      next.push(itemId);
    }
    setSelectedItemIds(next);
  };

  // Preset Handler for Multi-Year
  const handleApplyPreset = (preset: MultiYearPreset) => {
    setMultiYearPreset(preset);
    if (preset === 'last_2') {
      setSelectedMultiYears([2025, 2026]);
    } else if (preset === 'last_3') {
      setSelectedMultiYears([2024, 2025, 2026]);
    } else if (preset === 'last_5') {
      setSelectedMultiYears([2022, 2023, 2024, 2025, 2026]);
    } else if (preset === 'all') {
      setSelectedMultiYears([...AVAILABLE_YEARS]);
    }
  };

  // Custom Toggle individual year in Multi-Year
  const handleToggleMultiYear = (yr: number) => {
    setMultiYearPreset('custom');
    if (selectedMultiYears.includes(yr)) {
      if (selectedMultiYears.length <= 1) return; // Prevent empty
      setSelectedMultiYears(selectedMultiYears.filter(y => y !== yr).sort((a, b) => a - b));
    } else {
      setSelectedMultiYears([...selectedMultiYears, yr].sort((a, b) => a - b));
    }
  };

  // -------------------------------------------------------------
  // MULTI-YEAR DATA AGGREGATION
  // -------------------------------------------------------------
  const multiYearSummary = useMemo(() => {
    const sortedYears = [...selectedMultiYears].sort((a, b) => a - b);

    const yearDataList = sortedYears.map((yr, idx) => {
      let totalAmount = 0;
      let paidAmount = 0;
      const monthTotals: number[] = Array(12).fill(0);
      const monthPaidTotals: number[] = Array(12).fill(0);
      const categoryTotals: Record<string, number> = {};

      for (let m = 1; m <= 12; m++) {
        for (const item of activeItems) {
          const key = `${item.id}-${yr}-${m}`;
          const entry = entries[key];
          const amt = entry?.amount || 0;
          totalAmount += amt;
          monthTotals[m - 1] += amt;

          if (entry?.isPaid) {
            paidAmount += amt;
            monthPaidTotals[m - 1] += amt;
          }

          const catVal = statusFilter === 'PAID_ONLY' ? (entry?.isPaid ? amt : 0) : amt;
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + catVal;
        }
      }

      const displayTotal = statusFilter === 'PAID_ONLY' ? paidAmount : totalAmount;
      const monthlyAverage = Math.round(displayTotal / 12);

      // Peak month for this year
      let peakMonthIdx = 0;
      let peakMonthVal = 0;
      const monthArray = statusFilter === 'PAID_ONLY' ? monthPaidTotals : monthTotals;
      monthArray.forEach((val, mIdx) => {
        if (val > peakMonthVal) {
          peakMonthVal = val;
          peakMonthIdx = mIdx;
        }
      });

      // YoY compared to previous chronological year
      const prevYear = yr - 1;
      let prevYearTotal = 0;
      for (let m = 1; m <= 12; m++) {
        for (const item of activeItems) {
          const key = `${item.id}-${prevYear}-${m}`;
          const entry = entries[key];
          const amt = entry?.amount || 0;
          if (statusFilter === 'PAID_ONLY') {
            if (entry?.isPaid) prevYearTotal += amt;
          } else {
            prevYearTotal += amt;
          }
        }
      }

      const yoy = calculateYoY(displayTotal, prevYearTotal);
      const paidRatio = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

      return {
        year: yr,
        totalPlanned: totalAmount,
        totalPaid: paidAmount,
        remaining: Math.max(0, totalAmount - paidAmount),
        displayTotal,
        monthlyAverage,
        paidRatio,
        peakMonthName: MONTH_NAMES_TR[peakMonthIdx],
        peakMonthAmount: peakMonthVal,
        yoyGrowth: yoy,
        monthValues: monthArray,
        categoryTotals,
      };
    });

    const grandTotal = yearDataList.reduce((acc, d) => acc + d.displayTotal, 0);
    const grandPaid = yearDataList.reduce((acc, d) => acc + d.totalPaid, 0);
    const grandPlanned = yearDataList.reduce((acc, d) => acc + d.totalPlanned, 0);
    const annualAverage = yearDataList.length > 0 ? Math.round(grandTotal / yearDataList.length) : 0;

    // Peak & Lowest Year
    let peakYear = yearDataList[0];
    let lowestYear = yearDataList[0];
    yearDataList.forEach(d => {
      if (d.displayTotal > (peakYear?.displayTotal || 0)) peakYear = d;
      if (d.displayTotal < (lowestYear?.displayTotal || Infinity)) lowestYear = d;
    });

    // Cumulative growth from earliest to latest selected year
    const firstYearVal = yearDataList[0]?.displayTotal || 0;
    const lastYearVal = yearDataList[yearDataList.length - 1]?.displayTotal || 0;
    const totalGrowth = calculateYoY(lastYearVal, firstYearVal);

    // Max value for Multi-Year Bar Scaling
    const rawMax = Math.max(...yearDataList.map(d => d.displayTotal), 1000);
    let step = 100000;
    if (rawMax > 5000000) step = 1000000;
    else if (rawMax > 2000000) step = 500000;
    else if (rawMax > 1000000) step = 250000;
    else if (rawMax > 500000) step = 100000;
    else if (rawMax > 200000) step = 50000;
    else if (rawMax > 50000) step = 10000;

    const ceiling = Math.ceil((rawMax * 1.18) / step) * step;
    const yAxisSteps = [
      ceiling,
      Math.round(ceiling * 0.75),
      Math.round(ceiling * 0.5),
      Math.round(ceiling * 0.25),
      0
    ];

    // Max month value across all years for Month-by-Month Overlay
    let maxMonthVal = 0;
    yearDataList.forEach(yd => {
      yd.monthValues.forEach(mv => {
        if (mv > maxMonthVal) maxMonthVal = mv;
      });
    });
    const monthCeiling = Math.ceil((Math.max(maxMonthVal, 1000) * 1.15) / 25000) * 25000;

    return {
      years: yearDataList,
      grandTotal,
      grandPaid,
      grandPlanned,
      annualAverage,
      peakYear,
      lowestYear,
      totalGrowth,
      maxYearValue: ceiling,
      yAxisSteps,
      monthCeiling,
    };
  }, [selectedMultiYears, activeItems, entries, statusFilter]);

  // -------------------------------------------------------------
  // SINGLE-YEAR DATA AGGREGATION (for 12-month drilldown)
  // -------------------------------------------------------------
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      let totalAmount = 0;
      let paidAmount = 0;
      const itemBreakdowns: { id: string; name: string; amount: number; isPaid: boolean; category: string }[] = [];

      for (const item of activeItems) {
        const key = `${item.id}-${selectedYear}-${month}`;
        const entry = entries[key];
        const amt = entry?.amount || 0;
        totalAmount += amt;
        if (entry?.isPaid) {
          paidAmount += amt;
        }
        itemBreakdowns.push({
          id: item.id,
          name: item.name,
          amount: amt,
          isPaid: entry?.isPaid ?? false,
          category: item.category,
        });
      }

      const valueToDisplay = statusFilter === 'PAID_ONLY' ? paidAmount : totalAmount;
      const isPaidAll = activeItems.length > 0 && activeItems.every(it => {
        const entry = entries[`${it.id}-${selectedYear}-${month}`];
        return entry?.isPaid;
      });

      return {
        month,
        monthName: MONTH_NAMES_TR[i],
        shortName: MONTH_NAMES_SHORT_TR[i],
        total: totalAmount,
        paid: paidAmount,
        remaining: Math.max(0, totalAmount - paidAmount),
        valueToDisplay,
        isPaidAll,
        itemBreakdowns,
      };
    });
  }, [activeItems, entries, selectedYear, statusFilter]);

  // Previous year data for YoY calculation (Single year view)
  const prevYearTotal = useMemo(() => {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      for (const item of activeItems) {
        const key = `${item.id}-${selectedYear - 1}-${m}`;
        const entry = entries[key];
        const amt = entry?.amount || 0;
        if (statusFilter === 'PAID_ONLY') {
          if (entry?.isPaid) total += amt;
        } else {
          total += amt;
        }
      }
    }
    return total;
  }, [activeItems, entries, selectedYear, statusFilter]);

  const currentTotal = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.valueToDisplay, 0);
  }, [monthlyData]);

  const currentYearPaidTotal = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.paid, 0);
  }, [monthlyData]);

  const currentYearPlannedTotal = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.total, 0);
  }, [monthlyData]);

  const monthlyAverage = useMemo(() => {
    return currentTotal > 0 ? Math.round(currentTotal / 12) : 0;
  }, [currentTotal]);

  const currentMonthIdx = selectedYear === 2026 ? 9 : 11;
  const prevMonthIdx = currentMonthIdx > 0 ? currentMonthIdx - 1 : 0;
  const momGrowth = calculateMoM(
    monthlyData[currentMonthIdx]?.valueToDisplay || 0,
    monthlyData[prevMonthIdx]?.valueToDisplay || 0
  );
  const yoyGrowth = calculateYoY(currentTotal, prevYearTotal);

  // Category breakdown for Donut Chart
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of activeItems) {
      let sum = 0;
      for (let m = 1; m <= 12; m++) {
        const key = `${item.id}-${selectedYear}-${m}`;
        const entry = entries[key];
        if (entry) {
          if (statusFilter === 'PAID_ONLY' ? entry.isPaid : true) {
            sum += entry.amount || 0;
          }
        }
      }
      map[item.category] = (map[item.category] || 0) + sum;
    }

    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map).map(([catId, val]) => {
      const catObj = categories.find(c => c.id === catId);
      return {
        category: catObj?.name || catId,
        categoryId: catId,
        amount: val,
        percentage: total > 0 ? Math.round((val / total) * 100) : 0,
        color: catObj?.color || '#6366f1',
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [activeItems, categories, entries, selectedYear, statusFilter]);

  // Scaling for single year bar chart
  const { maxChartValue, yAxisSteps } = useMemo(() => {
    const rawMax = Math.max(...monthlyData.map(d => d.valueToDisplay), 1000);
    let step = 1000;
    if (rawMax > 500000) step = 100000;
    else if (rawMax > 200000) step = 50000;
    else if (rawMax > 100000) step = 25000;
    else if (rawMax > 50000) step = 10000;
    else if (rawMax > 20000) step = 5000;
    else if (rawMax > 10000) step = 2000;

    const ceiling = Math.ceil((rawMax * 1.18) / step) * step;
    const steps = [
      ceiling,
      Math.round(ceiling * 0.75),
      Math.round(ceiling * 0.5),
      Math.round(ceiling * 0.25),
      0
    ];
    return { maxChartValue: ceiling, yAxisSteps: steps };
  }, [monthlyData]);

  // Color map for individual items
  const itemColorMap = useMemo(() => {
    const colors = [
      '#6366f1', '#ec4899', '#10b981', '#06b6d4', 
      '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e', 
      '#3b82f6', '#84cc16'
    ];
    const map: Record<string, string> = {};
    items.forEach((item, idx) => {
      map[item.id] = colors[idx % colors.length];
    });
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-6">

      {/* Top Bar: Primary Expense Focus Selector (Gider Odak Seçici) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Gider Odak Seçici
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {singleSelectedItem 
                  ? `${singleSelectedItem.name} · Finansal Analiz & Grafikler`
                  : selectedItemIds.includes('ALL') 
                  ? 'Tüm Giderler · Konsolide Finansal Analiz'
                  : `${activeItems.length} Kalem Seçili · Kıyaslama Analizi`}
              </h2>
            </div>
          </div>

          {/* Quick Item Dropdown Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto">
            <label htmlFor="expense-focus-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
              Gider Kalemi:
            </label>
            <select
              id="expense-focus-select"
              value={selectedItemIds.length === 1 ? selectedItemIds[0] : selectedItemIds.includes('ALL') ? 'ALL' : 'MULTI'}
              onChange={(e) => handleQuickSelect(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto min-w-0 sm:min-w-[220px]"
            >
              <option value="ALL">🏢 Tüm Giderler Özeti (Konsolide)</option>
              <optgroup label="Tekil Gider Kalemleri">
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category})
                  </option>
                ))}
              </optgroup>
              {!selectedItemIds.includes('ALL') && selectedItemIds.length > 1 && (
                <option value="MULTI" disabled>
                  ✓ Çoklu Seçim Aktif ({selectedItemIds.length} Kalem)
                </option>
              )}
            </select>
          </div>

        </div>
      </div>

      {/* Main Mode Horizon Switcher: [Tek Yıl Analizi (12 Ay)] vs [Çok Yıllı Karşılaştırma & Trendler] */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Horizon Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setHorizonMode('multi')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                horizonMode === 'multi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>Çok Yıllı Kıyaslama & Trendler</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-mono font-medium">
                {selectedMultiYears.length} Yıl
              </span>
            </button>
            <button
              onClick={() => setHorizonMode('single')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                horizonMode === 'single'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Tek Yıl Odak ({selectedYear})</span>
            </button>
          </div>
        </div>

        {/* Right Status Filter: Paid Only vs All Planned */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Veri Durumu:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('PAID_ONLY')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                statusFilter === 'PAID_ONLY' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sadece Ödenenler
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tüm Planlanan
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MULTI-YEAR HORIZON MODE CONTROLS & DASHBOARD                              */}
      {/* ========================================================================= */}
      {horizonMode === 'multi' && (
        <div className="flex flex-col gap-6">

          {/* Multi-Year Year Presets and Custom Chips Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col gap-4">
            
            {/* Presets Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Hızlı Yıl Seçimi:
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleApplyPreset('last_2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    multiYearPreset === 'last_2'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ⚡ Son 2 Yıl (2025–2026)
                </button>
                <button
                  onClick={() => handleApplyPreset('last_3')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    multiYearPreset === 'last_3'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  📊 Son 3 Yıl (2024–2026)
                </button>
                <button
                  onClick={() => handleApplyPreset('last_5')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    multiYearPreset === 'last_5'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🎯 Son 5 Yıl (2022–2026)
                </button>
                <button
                  onClick={() => handleApplyPreset('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    multiYearPreset === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  🌐 Tüm Yıllar (2022–2028: {AVAILABLE_YEARS.length} Yıl)
                </button>
              </div>
            </div>

            {/* Custom Interactive Chips: Pick any combination of years */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Özel Yıl Seçici (Tek tek dahil et / çıkar):
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {AVAILABLE_YEARS.map(yr => {
                  const isSelected = selectedMultiYears.includes(yr);
                  const colorConfig = YEAR_COLORS[yr];
                  return (
                    <button
                      key={yr}
                      onClick={() => handleToggleMultiYear(yr)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-400 dark:border-indigo-600 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${colorConfig?.bg || 'bg-slate-400'}`} />
                      {isSelected ? <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <span className="w-3 inline-block" />}
                      <span>{yr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Multi-Year 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Across Selected Years */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {statusFilter === 'PAID_ONLY' ? 'Seçili Yıllar Toplam Ödenen' : 'Seçili Yıllar Toplam Bütçe'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCurrency(multiYearSummary.grandTotal)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{selectedMultiYears.length} Yıllık Kapsam</span>
                {statusFilter === 'ALL' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    Ödenen: {formatCurrency(multiYearSummary.grandPaid, true)}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Annual Average Spend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Yıllık Ortalama Gider
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarRange className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCurrency(multiYearSummary.annualAverage)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Aylık ortalama eşdeğeri: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(Math.round(multiYearSummary.annualAverage / 12), true)}</strong>
              </div>
            </div>

            {/* Card 3: Cumulative Growth (Earliest to Latest) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Dönemsel Toplam Büyüme
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  multiYearSummary.totalGrowth.percentage >= 0
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {multiYearSummary.totalGrowth.percentage >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold font-mono tracking-tight ${
                  multiYearSummary.totalGrowth.percentage >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {multiYearSummary.totalGrowth.percentage >= 0 ? `+${multiYearSummary.totalGrowth.percentage}%` : `${multiYearSummary.totalGrowth.percentage}%`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {selectedMultiYears[0]} &rarr; {selectedMultiYears[selectedMultiYears.length - 1]}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedMultiYears.length} yıllık net maliyet artış/değişim oranı
              </div>
            </div>

            {/* Card 4: Peak Spending Year */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Zirve Harcama Yılı
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{multiYearSummary.peakYear?.year} Yılı</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                Zirve Tutar: <strong className="text-purple-600 dark:text-purple-400">{formatCurrency(multiYearSummary.peakYear?.displayTotal || 0, true)}</strong>
              </div>
            </div>

          </div>

          {/* Multi-Year Chart Type Selector Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs transition-colors">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
              <button
                onClick={() => setMultiChartType('yearly_bars')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  multiChartType === 'yearly_bars'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                <span>Yıllık Toplamlar & YoY Büyüme</span>
              </button>
              <button
                onClick={() => setMultiChartType('monthly_overlay')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  multiChartType === 'monthly_overlay'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span>12 Aylık Karşılaştırma (Ay Ay Üst Üste)</span>
              </button>
              <button
                onClick={() => setMultiChartType('category_trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  multiChartType === 'category_trend'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                <span>Çok Yıllı Kategori Trendi</span>
              </button>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <span>Seçili: </span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {selectedMultiYears.join(', ')} ({selectedMultiYears.length} Yıl)
              </strong>
            </div>
          </div>

          {/* MULTI-YEAR CHART 1: YEARLY TOTALS & GROWTH BAR CHART */}
          {multiChartType === 'yearly_bars' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Yıllık Toplam Harcama & YoY Büyüme Grafiği</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {statusFilter === 'PAID_ONLY' ? 'Sadece Ödenenler' : 'Tüm Planlanan'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Seçilen yılların toplam bütçesi, üst uçlardaki net tutarlar ve bir önceki yıla göre artış oranları
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Dönem Toplamı</span>
                  <span className="text-base sm:text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(multiYearSummary.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Chart Body */}
              <div className="w-full select-none">
                <div className="relative h-80 w-full flex">
                  
                  {/* Left Y-Axis */}
                  <div className="w-16 sm:w-24 shrink-0 flex flex-col justify-between py-2 text-right pr-2 font-mono text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 pointer-events-none border-r border-slate-200 dark:border-slate-800">
                    {multiYearSummary.yAxisSteps.map((stepVal, idx) => (
                      <span key={idx} className="whitespace-nowrap">
                        {formatCurrency(stepVal, true)}
                      </span>
                    ))}
                  </div>

                  {/* Chart Bars */}
                  <div className="flex-1 relative flex flex-col justify-between px-2 sm:px-6">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                      {multiYearSummary.yAxisSteps.map((stepVal, idx) => (
                        <div key={idx} className="w-full flex items-center">
                          <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-800" />
                        </div>
                      ))}
                    </div>

                    {/* Bars container */}
                    <div className="relative z-10 h-full flex items-end justify-around gap-2 sm:gap-6 pt-10 pb-1">
                      {multiYearSummary.years.map((yd) => {
                        const heightPercent = multiYearSummary.maxYearValue > 0 
                          ? (yd.displayTotal / multiYearSummary.maxYearValue) * 100 
                          : 0;
                        const isHovered = hoveredMultiYear === yd.year;
                        const isCurrentYear = yd.year === 2026;
                        const colorConfig = YEAR_COLORS[yd.year];

                        return (
                          <div
                            key={yd.year}
                            onMouseEnter={() => setHoveredMultiYear(yd.year)}
                            onMouseLeave={() => setHoveredMultiYear(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative max-w-[90px]"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-16 z-30 bg-slate-900 text-white text-[11px] font-mono py-2 px-3 rounded-xl border border-slate-700 shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                                <div className="font-sans font-bold text-indigo-300 text-xs">
                                  {yd.year} Yılı Detayı
                                </div>
                                <div className="text-white font-bold mt-0.5">
                                  Toplam: {formatCurrency(yd.displayTotal)}
                                </div>
                                <div className="text-slate-300 text-[10px] mt-0.5">
                                  Aylık Ort: {formatCurrency(yd.monthlyAverage)} · Ödeme: %{yd.paidRatio}
                                </div>
                              </div>
                            )}

                            {/* Top Data Label on Bar */}
                            <div className="mb-1.5 text-center flex flex-col items-center pointer-events-none">
                              <span className={`text-[10px] sm:text-xs font-mono font-bold leading-none px-1.5 py-0.5 rounded-md ${
                                isCurrentYear
                                  ? 'text-indigo-600 dark:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-700'
                                  : 'text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90'
                              }`}>
                                {formatCurrency(yd.displayTotal, true)}
                              </span>
                            </div>

                            {/* The Visual Bar */}
                            <div
                              className={`w-full rounded-t-xl transition-all duration-200 relative overflow-hidden ${
                                isCurrentYear
                                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400'
                                  : isHovered
                                  ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                                  : 'bg-gradient-to-t from-slate-700 to-indigo-600 dark:from-indigo-900 dark:to-indigo-600 hover:from-indigo-600 hover:to-indigo-500'
                              }`}
                              style={{ height: `${Math.max(4, heightPercent)}%` }}
                            >
                              <div className="h-1.5 bg-white/40 dark:bg-white/30 w-full" />
                            </div>

                            {/* YoY Growth Badge Below Bar */}
                            <div className="mt-2 text-center">
                              {yd.yoyGrowth.diff !== 0 && (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 ${
                                  yd.yoyGrowth.percentage > 0
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}>
                                  {yd.yoyGrowth.percentage > 0 ? `+${yd.yoyGrowth.percentage}%` : `${yd.yoyGrowth.percentage}%`}
                                </span>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>

                {/* X-Axis Year Labels */}
                <div className="flex ml-16 sm:ml-24 justify-around gap-2 sm:gap-6 pt-2 text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                  {multiYearSummary.years.map(yd => (
                    <div key={yd.year} className="flex-1 text-center">
                      <span className={`block ${yd.year === 2026 ? 'text-indigo-600 dark:text-indigo-400 underline decoration-2' : ''}`}>
                        {yd.year}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* MULTI-YEAR CHART 2: 12 MONTH-BY-MONTH OVERLAY (SEASONAL OVERLAY CHART) */}
          {multiChartType === 'monthly_overlay' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>Yıllar Arası Ay Ay Karşılaştırma Grafiği (12 Ay Üst Üste)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mevsimsel harcama trendleri ve enflasyonist artışları ay ay kıyaslayın
                  </p>
                </div>

                {/* Years Legend */}
                <div className="flex items-center gap-2 flex-wrap">
                  {multiYearSummary.years.map(yd => {
                    const color = YEAR_COLORS[yd.year];
                    return (
                      <div key={yd.year} className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                        <span className={`w-3 h-3 rounded-full ${color?.bg || 'bg-slate-500'}`} />
                        <span className="text-slate-700 dark:text-slate-300">{yd.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grouped Month Bars */}
              <div className="w-full select-none overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="relative h-80 w-full flex">
                    
                    {/* Left Y-Scale */}
                    <div className="w-16 shrink-0 flex flex-col justify-between py-2 text-right pr-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 pointer-events-none border-r border-slate-200 dark:border-slate-800">
                      <span>{formatCurrency(multiYearSummary.monthCeiling, true)}</span>
                      <span>{formatCurrency(Math.round(multiYearSummary.monthCeiling * 0.75), true)}</span>
                      <span>{formatCurrency(Math.round(multiYearSummary.monthCeiling * 0.5), true)}</span>
                      <span>{formatCurrency(Math.round(multiYearSummary.monthCeiling * 0.25), true)}</span>
                      <span>0 TL</span>
                    </div>

                    {/* Month Clusters */}
                    <div className="flex-1 relative flex flex-col justify-between px-3">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                        {[0, 1, 2, 3, 4].map(idx => (
                          <div key={idx} className="w-full border-b border-dashed border-slate-200 dark:border-slate-800" />
                        ))}
                      </div>

                      {/* 12 Month Slots */}
                      <div className="relative z-10 h-full flex items-end justify-between gap-2 pt-8 pb-1">
                        {Array.from({ length: 12 }, (_, mIdx) => {
                          const mNum = mIdx + 1;
                          const isMonthHovered = hoveredOverlayMonth === mNum;

                          return (
                            <div
                              key={mNum}
                              onMouseEnter={() => setHoveredOverlayMonth(mNum)}
                              onMouseLeave={() => setHoveredOverlayMonth(null)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              {/* Hover details */}
                              {isMonthHovered && (
                                <div className="absolute -top-24 z-30 bg-slate-900 text-white text-[11px] font-mono py-2 px-3 rounded-xl border border-slate-700 shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                                  <div className="font-sans font-bold text-indigo-300 text-xs mb-1">
                                    {MONTH_NAMES_TR[mIdx]} Ayı Karşılaştırması
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                                    {multiYearSummary.years.map(yd => (
                                      <div key={yd.year} className="flex items-center justify-between gap-2">
                                        <span className="text-slate-400">{yd.year}:</span>
                                        <span className="text-white font-bold">{formatCurrency(yd.monthValues[mIdx])}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cluster of bars for this month across selected years */}
                              <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                                {multiYearSummary.years.map(yd => {
                                  const val = yd.monthValues[mIdx] || 0;
                                  const height = multiYearSummary.monthCeiling > 0 ? (val / multiYearSummary.monthCeiling) * 100 : 0;
                                  const color = YEAR_COLORS[yd.year];

                                  return (
                                    <div
                                      key={yd.year}
                                      className={`flex-1 rounded-t transition-all duration-150 ${color?.bg || 'bg-indigo-500'} hover:brightness-110`}
                                      style={{ height: `${Math.max(2, height)}%` }}
                                      title={`${yd.year} ${MONTH_NAMES_TR[mIdx]}: ${formatCurrency(val)}`}
                                    />
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>

                  </div>

                  {/* Month names at bottom */}
                  <div className="flex ml-16 justify-between gap-2 pt-2 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                    {MONTH_NAMES_SHORT_TR.map((mName, idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <span>{mName}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* MULTI-YEAR CHART 3: CATEGORY TREND OVER YEARS */}
          {multiChartType === 'category_trend' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
              <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-500" />
                  <span>Kategorilerin Yıllara Göre Değişimi ve Dağılımı</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seçilen yıllarda ana harcama kategorilerinin bütçe içindeki payı
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  return (
                    <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{cat.name}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {multiYearSummary.years.map(yd => {
                          const catAmount = yd.categoryTotals[cat.id] || 0;
                          const percent = yd.displayTotal > 0 ? Math.round((catAmount / yd.displayTotal) * 100) : 0;

                          return (
                            <div key={yd.year} className="text-xs">
                              <div className="flex items-center justify-between font-mono mb-1">
                                <span className="text-slate-500 dark:text-slate-400">{yd.year}:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(catAmount)}
                                  <span className="text-[10px] text-slate-400 ml-1">(%{percent})</span>
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, percent)}%`,
                                    backgroundColor: cat.color
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* MULTI-YEAR COMPARISON MATRIX TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-indigo-500" />
                  <span>Çok Yıllı Finansal Karşılaştırma & Özet Tablosu</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seçilen {selectedMultiYears.length} yılın bütçe gerçekleşmeleri, büyüme oranları ve zirve ayları
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {selectedMultiYears.length} Yıllık Kıyaslama
              </span>
            </div>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Yıl</th>
                    <th className="py-2.5 px-3 text-right">Toplam Bütçe</th>
                    <th className="py-2.5 px-3 text-right">Ödenen Tutar</th>
                    <th className="py-2.5 px-3 text-right">Kalan Bakiye</th>
                    <th className="py-2.5 px-3 text-center">Ödeme Oranı</th>
                    <th className="py-2.5 px-3 text-center">Yıllık Büyüme (YoY)</th>
                    <th className="py-2.5 px-3 text-right">Aylık Ortalama</th>
                    <th className="py-2.5 px-3">En Yüksek Harcama Ayı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {multiYearSummary.years.map((yd) => {
                    const isCurrentYear = yd.year === 2026;

                    return (
                      <tr
                        key={yd.year}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isCurrentYear ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-sans font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${YEAR_COLORS[yd.year]?.bg || 'bg-slate-400'}`} />
                            <span>{yd.year}</span>
                            {isCurrentYear && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-600 text-white font-normal">
                                Güncel
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right text-slate-900 dark:text-white font-bold">
                          {formatCurrency(yd.totalPlanned)}
                        </td>

                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(yd.totalPaid)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {yd.remaining > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {formatCurrency(yd.remaining)}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">0 TL</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, yd.paidRatio)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              %{yd.paidRatio}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {yd.yoyGrowth.diff !== 0 ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs ${
                              yd.yoyGrowth.percentage >= 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              {yd.yoyGrowth.percentage >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span>{yd.yoyGrowth.percentage >= 0 ? `+${yd.yoyGrowth.percentage}%` : `${yd.yoyGrowth.percentage}%`}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                          {formatCurrency(yd.monthlyAverage)}
                        </td>

                        <td className="py-3 px-3 font-sans text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {yd.peakMonthName}
                          </span>
                          <span className="text-slate-400 font-mono ml-1">
                            ({formatCurrency(yd.peakMonthAmount, true)})
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 font-mono font-bold bg-slate-50/50 dark:bg-slate-800/40">
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-900 dark:text-white">GENEL TOPLAM</td>
                    <td className="py-3 px-3 text-right text-slate-900 dark:text-white text-sm">
                      {formatCurrency(multiYearSummary.grandPlanned)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(multiYearSummary.grandPaid)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(Math.max(0, multiYearSummary.grandPlanned - multiYearSummary.grandPaid))}
                    </td>
                    <td className="py-3 px-3 text-center font-sans text-xs text-slate-600 dark:text-slate-300">
                      Ort. %{multiYearSummary.grandPlanned > 0 ? Math.round((multiYearSummary.grandPaid / multiYearSummary.grandPlanned) * 100) : 0}
                    </td>
                    <td colSpan={3} className="py-3 px-3 text-right font-sans text-xs text-slate-500 font-normal">
                      Yıllık Ortalama: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(multiYearSummary.annualAverage)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE-YEAR HORIZON MODE (12 MONTH DETAILED DRILLDOWN)                    */}
      {/* ========================================================================= */}
      {horizonMode === 'single' && (
        <div className="flex flex-col gap-6">

          {/* Top 3 Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Metric 1: Toplam Tutar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {statusFilter === 'PAID_ONLY' ? 'Toplam Ödenen Gider' : 'Yıllık Toplam Planlanan'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCurrency(currentTotal)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{selectedYear} yılı için {activeItems.length} kalem</span>
                {statusFilter === 'ALL' && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Ödenen: {formatCurrency(currentYearPaidTotal)}
                  </span>
                )}
              </div>
            </div>

            {/* Metric 2: Aylık Ortalama */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Aylık Ortalama Ödeme
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                {formatCurrency(monthlyAverage)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {singleSelectedItem 
                  ? `Aylık ortalama ${singleSelectedItem.name} harcaması` 
                  : 'Seçili kalemlerin aylık ortalama nakit çıkışı'}
              </div>
            </div>

            {/* Metric 3: Değişim & Sayaç / Büyüme Oranı */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {singleSelectedItem ? 'Vade Günü & Sayaç' : 'Değişim & Büyüme Oranı'}
                </span>
                {singleSelectedItem ? (
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    yoyGrowth.percentage >= 0 
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {yoyGrowth.percentage >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                )}
              </div>

              {singleSelectedItem ? (
                <div className="mt-2">
                  <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Her ayın {singleSelectedItem.defaultDueDay}'i</span>
                    {(() => {
                      const entry = entries[`${singleSelectedItem.id}-${selectedYear}-10`];
                      const due = getDaysUntilDue(singleSelectedItem.defaultDueDay, 10, selectedYear, entry?.isPaid);
                      return (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          due.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          due.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                          due.status === 'approaching' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {due.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Kategori: <strong className="text-indigo-600 dark:text-indigo-400">{singleSelectedItem.category}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className={`text-2xl font-bold font-mono tracking-tight ${
                      yoyGrowth.percentage > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {yoyGrowth.percentage > 0 ? `+${yoyGrowth.percentage}%` : `${yoyGrowth.percentage}%`}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Yıllık (YoY)</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>Aydan Aya (MoM):</span>
                    <span className={`font-mono font-semibold ${momGrowth.percentage >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {momGrowth.percentage >= 0 ? `+${momGrowth.percentage}%` : `${momGrowth.percentage}%`}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Single Year Controls Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs transition-colors">
            
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full shrink-0">
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  chartType === 'bar' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span>Çubuk (Bar) · Fiyatlı</span>
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  chartType === 'area' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Çizgi / Alan</span>
              </button>
              <button
                onClick={() => setChartType('donut')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  chartType === 'donut' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Kategori Dağılımı</span>
              </button>
            </div>

            {/* Year Selector Dropdown for Single Year */}
            <div className="flex items-center gap-2">
              <label htmlFor="single-year-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                Görüntülenen Yıl:
              </label>
              <select
                id="single-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {AVAILABLE_YEARS.map(yr => (
                  <option key={yr} value={yr}>
                    {yr} Yılı {yr === 2026 ? '(Güncel)' : yr > 2026 ? '(Projeksiyon)' : ''}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Multi-Select Expense Items Filter Pills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>Kıyaslanacak Kalemleri Seçin (Çoklu Seçim):</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeItems.length} kalem seçildi
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleToggleItem('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedItemIds.includes('ALL')
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tüm Kalemler ({items.length})
              </button>
              {items.map(item => {
                const isSelected = selectedItemIds.includes(item.id);
                const color = itemColorMap[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/50 shadow-2xs font-semibold'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {isSelected ? <CheckSquare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-3 h-3 opacity-40" />}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Year Chart Canvas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {singleSelectedItem
                      ? `${singleSelectedItem.name} - ${selectedYear} Aylık Ödeme Grafiği`
                      : chartType === 'donut'
                      ? `${selectedYear} Yılı Kategori Dağılımı`
                      : `${selectedYear} Aylık Harcama Grafiği (${statusFilter === 'PAID_ONLY' ? 'Ödenenler' : 'Tüm Planlanan'})`}
                  </span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {statusFilter === 'PAID_ONLY' ? 'Ödenen Tutarlar' : 'Toplam Planlanan'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {singleSelectedItem 
                    ? `Vade: Her ayın ${singleSelectedItem.defaultDueDay}'i · Grafikte her ayın ödenen net tutarı uçlarda belirtilmiştir`
                    : selectedItemIds.includes('ALL') 
                    ? 'Tüm gider kalemlerinin aylık toplam ödemeleri ve üst sınırdaki fiyat seviyeleri' 
                    : `${activeItems.length} özel gider kalemi kıyaslanıyor`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Dönem Toplamı</span>
                <span className="text-base sm:text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(currentTotal)}
                </span>
              </div>
            </div>

            {/* 1. Bar Chart with Y-Axis and Data Labels on Top */}
            {chartType === 'bar' && (
              <div className="w-full select-none">
                <div className="relative h-80 w-full flex">
                  
                  {/* Left Y-Axis */}
                  <div className="w-12 sm:w-20 shrink-0 flex flex-col justify-between py-2 text-right pr-1 sm:pr-2 font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 pointer-events-none border-r border-slate-200 dark:border-slate-800">
                    {yAxisSteps.map((stepVal, idx) => (
                      <span key={idx} className="whitespace-nowrap">
                        {formatCurrency(stepVal, true)}
                      </span>
                    ))}
                  </div>

                  {/* Chart Body */}
                  <div className="flex-1 relative flex flex-col justify-between px-1 sm:px-4">
                    <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                      {yAxisSteps.map((stepVal, idx) => (
                        <div key={idx} className="w-full flex items-center">
                          <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-800" />
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 h-full flex items-end justify-between gap-0.5 sm:gap-3 pt-8 pb-1">
                      {monthlyData.map((d) => {
                        const heightPercent = maxChartValue > 0 ? (d.valueToDisplay / maxChartValue) * 100 : 0;
                        const isHovered = hoveredMonth === d.month;
                        const isCurrent = selectedYear === 2026 && d.month === 10;
                        const isPaid = d.isPaidAll || d.paid > 0;

                        return (
                          <div
                            key={d.month}
                            onMouseEnter={() => setHoveredMonth(d.month)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-14 z-30 bg-slate-900 text-white text-[11px] font-mono py-1.5 px-2.5 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                                <div className="font-sans font-bold text-indigo-300">
                                  {d.monthName} {selectedYear}
                                </div>
                                <div className="text-white font-bold">
                                  Ödenen: {formatCurrency(d.paid)}
                                </div>
                                {d.remaining > 0 && (
                                  <div className="text-amber-400 text-[10px]">
                                    Kalan: {formatCurrency(d.remaining)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Top Data Label */}
                            <div className="mb-1 text-center flex flex-col items-center pointer-events-none">
                              <span className={`text-[8px] sm:text-[11px] font-mono font-bold leading-none px-0.5 sm:px-1 py-0.5 rounded ${
                                d.valueToDisplay === 0
                                  ? 'text-slate-300 dark:text-slate-600'
                                  : isCurrent
                                  ? 'text-indigo-600 dark:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800'
                                  : 'text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80'
                              }`}>
                                {d.valueToDisplay > 0 ? formatCurrency(d.valueToDisplay, true) : '0'}
                              </span>
                              {d.valueToDisplay > 0 && isPaid && (
                                <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                              )}
                            </div>

                            {/* Visual Bar */}
                            <div
                              className={`w-full max-w-[42px] rounded-t-md transition-all duration-200 relative overflow-hidden ${
                                isCurrent
                                  ? 'bg-gradient-to-t from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/50'
                                  : isHovered
                                  ? 'bg-gradient-to-t from-indigo-500 to-indigo-400'
                                  : d.valueToDisplay === 0
                                  ? 'bg-slate-200/60 dark:bg-slate-800/40'
                                  : 'bg-gradient-to-t from-indigo-400/90 to-indigo-300 dark:from-indigo-600/80 dark:to-indigo-500/80 hover:from-indigo-500 hover:to-indigo-400'
                              }`}
                              style={{ height: `${Math.max(3, heightPercent)}%` }}
                            >
                              {d.valueToDisplay > 0 && (
                                <div className="h-1 bg-white/40 dark:bg-white/30 w-full" />
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Right Y-Axis */}
                  <div className="hidden md:flex w-20 shrink-0 flex flex-col justify-between py-2 text-left pl-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 pointer-events-none border-l border-slate-200 dark:border-slate-800">
                    {yAxisSteps.map((stepVal, idx) => (
                      <span key={idx} className="whitespace-nowrap">
                        {formatCurrency(stepVal, true)}
                      </span>
                    ))}
                  </div>

                </div>

                {/* X-Axis */}
                <div className="flex ml-12 sm:ml-20 mr-0 md:mr-20 justify-between gap-0.5 sm:gap-3 pt-2 text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  {monthlyData.map(d => (
                    <div key={d.month} className="flex-1 text-center truncate">
                      <span className={`block font-semibold ${
                        selectedYear === 2026 && d.month === 10 
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold underline decoration-2' 
                          : ''
                      }`}>
                        {d.shortName}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 2. Line / Area Chart */}
            {chartType === 'area' && (
              <div className="w-full select-none">
                <div className="relative h-80 w-full flex">
                  
                  <div className="w-12 sm:w-20 shrink-0 flex flex-col justify-between py-2 text-right pr-1 sm:pr-2 font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 pointer-events-none border-r border-slate-200 dark:border-slate-800">
                    {yAxisSteps.map((stepVal, idx) => (
                      <span key={idx} className="whitespace-nowrap">
                        {formatCurrency(stepVal, true)}
                      </span>
                    ))}
                  </div>

                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                      {yAxisSteps.map((stepVal, idx) => (
                        <div key={idx} className="w-full flex items-center">
                          <div className="w-full border-b border-dashed border-slate-200 dark:border-slate-800" />
                        </div>
                      ))}
                    </div>

                    <div className="relative h-full w-full py-2">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaGradientV3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {(() => {
                          const points = monthlyData.map((d, i) => {
                            const x = (i / 11) * 940 + 30;
                            const y = 220 - (maxChartValue > 0 ? (d.valueToDisplay / maxChartValue) * 190 : 0);
                            return { x, y, ...d };
                          });

                          const lineCmd = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                          const areaCmd = `${lineCmd} L ${points[points.length - 1].x} 230 L ${points[0].x} 230 Z`;

                          return (
                            <>
                              <path d={areaCmd} fill="url(#areaGradientV3)" />
                              <path d={lineCmd} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                              
                              {points.map((p) => (
                                <g key={p.month} className="cursor-pointer">
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={hoveredMonth === p.month ? 7 : 5}
                                    className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-2 transition-all"
                                    onMouseEnter={() => setHoveredMonth(p.month)}
                                    onMouseLeave={() => setHoveredMonth(null)}
                                  />
                                  {p.valueToDisplay > 0 && (
                                    <text
                                      x={p.x}
                                      y={p.y - 12}
                                      textAnchor="middle"
                                      className="font-mono text-[10px] font-bold fill-slate-800 dark:fill-slate-200"
                                    >
                                      {formatCurrency(p.valueToDisplay, true)}
                                    </text>
                                  )}
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                  </div>

                </div>

                <div className="flex ml-12 sm:ml-20 justify-between gap-0.5 sm:gap-3 pt-2 text-[10px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                  {monthlyData.map(d => (
                    <div key={d.month} className="flex-1 text-center">
                      <span className={`block font-semibold ${selectedYear === 2026 && d.month === 10 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}>
                        {d.shortName}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 3. Donut Chart */}
            {chartType === 'donut' && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
                <div className="relative w-56 h-56 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      let accumulatedPercent = 0;
                      return categoryBreakdown.map((item) => {
                        const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                        const strokeDashoffset = -accumulatedPercent;
                        accumulatedPercent += item.percentage;

                        return (
                          <circle
                            key={item.categoryId}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="16"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            pathLength="100"
                            className="transition-all hover:opacity-80 cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Toplam Ödenen
                    </span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(currentTotal, true)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryBreakdown.map(item => (
                    <div key={item.categoryId} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white w-10 text-right">
                          %{item.percentage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{selectedYear} Yılı Aylık Ödeme Döküm Tablosu</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seçili {activeItems.length} kalemin ay ay ödenen, kalan tutarları ve vade durumu
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                12 Aylık Döküm
              </span>
            </div>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3">Ay</th>
                    <th className="py-2.5 px-3 text-right">Ödenen Tutar</th>
                    <th className="py-2.5 px-3 text-right">Toplam Bütçe</th>
                    <th className="py-2.5 px-3 text-right">Kalan Borç</th>
                    <th className="py-2.5 px-3 text-center">Ödeme Durumu</th>
                    <th className="py-2.5 px-3">Seçili Kalem Detayı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {monthlyData.map((d) => {
                    const isCurrent = selectedYear === 2026 && d.month === 10;
                    const isFullyPaid = d.total > 0 && d.paid >= d.total;
                    const isPartiallyPaid = d.paid > 0 && d.paid < d.total;

                    return (
                      <tr
                        key={d.month}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{d.monthName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-600 text-white font-normal">
                                Şu an
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(d.paid)}
                        </td>

                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                          {formatCurrency(d.total)}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {d.remaining > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {formatCurrency(d.remaining)}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">0 TL</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-sans">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Ödendi
                            </span>
                          ) : isPartiallyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <Clock className="w-3 h-3" />
                              Kısmi Ödendi
                            </span>
                          ) : d.total > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Clock className="w-3 h-3" />
                              Bekliyor
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-sans text-xs text-slate-500 dark:text-slate-400">
                          {singleSelectedItem ? (
                            <span>Her ayın {singleSelectedItem.defaultDueDay}'i vadeli</span>
                          ) : (
                            <div className="flex items-center gap-1 flex-wrap">
                              {d.itemBreakdowns.slice(0, 3).map(b => (
                                <span key={b.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {b.name.split(' ')[0]}: {formatCurrency(b.amount, true)}
                                </span>
                              ))}
                              {d.itemBreakdowns.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{d.itemBreakdowns.length - 3} kalem
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 font-mono font-bold bg-slate-50/50 dark:bg-slate-800/40">
                  <tr>
                    <td className="py-3 px-3 font-sans text-slate-900 dark:text-white">GENEL TOPLAM</td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(currentYearPaidTotal)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900 dark:text-white text-sm">
                      {formatCurrency(currentYearPlannedTotal)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(Math.max(0, currentYearPlannedTotal - currentYearPaidTotal))}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-right font-sans text-xs text-slate-500 font-normal">
                      Seçilen filtrelere göre {selectedYear} yılı toplam gerçekleşen veriler
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
