import { useState, useEffect, useMemo } from "react";
import { useWatchlist } from "./hooks/useWatchlist";
import { useStockData } from "./hooks/useStockData";
import { useCategories } from "./hooks/useCategories";
import { useTopPicks } from "./hooks/useTopPicks";
import { MarketTicker } from "./components/MarketTicker";
import { TopPicks } from "./components/TopPicks";
import { StockChart } from "./components/StockChart";
import { WatchList } from "./components/WatchList";
import { SearchBar } from "./components/SearchBar";
import { CategoryFilter } from "./components/CategoryFilter";
import type { Category } from "./types/categories";
import { ALL_CATEGORIES } from "./types/categories";
import "./index.css";

export function App() {
  const { watchlist, allSymbols, addSymbol, removeSymbol } = useWatchlist();
  const { data, loading, lastUpdated, error, refresh } = useStockData(allSymbols);
  const { getCategory, setCategory } = useCategories(watchlist);
  const { topPicks } = useTopPicks();
  const [selected, setSelected] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);

  // Auto-select top pick once data loads
  useEffect(() => {
    if (selected || data.size === 0) return;
    const top = watchlist
      .map((s) => ({ s, score: data.get(s)?.analysis.score ?? 0 }))
      .sort((a, b) => b.score - a.score)[0];
    if (top) setSelected(top.s);
  }, [data.size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build active categories + counts for the filter bar
  const { activeCategories, categoryCounts } = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const sym of watchlist) {
      const cat = getCategory(sym);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    const active = ALL_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0);
    return { activeCategories: active, categoryCounts: counts };
  }, [watchlist, getCategory]);

  const selectedData = selected ? data.get(selected) : null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-sm font-bold">S</div>
          <span className="font-bold text-white text-base tracking-tight">StockPulse</span>
          <span className="text-slate-500 text-xs hidden sm:inline">/ Developer Dashboard</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {lastUpdated && (
            <span className="text-slate-500 text-xs hidden md:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {error && <span className="text-rose-400 text-xs">{error}</span>}
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <SearchBar onAdd={addSymbol} />

        </div>
      </header>

      {/* Market ticker */}
      <MarketTicker data={data} />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Top Picks */}
        <aside className="w-60 shrink-0 border-r border-slate-700/50 bg-slate-900/40 overflow-hidden hidden lg:flex flex-col">
          <TopPicks
            data={data}
            watchlist={watchlist}
            selected={selected}
            onSelect={setSelected}
            getCategory={getCategory}
            overridePicks={topPicks.length > 0 ? topPicks : undefined}
          />
        </aside>

        {/* Center / Right: Chart + CategoryFilter + Watchlist */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chart area */}
          <div className="h-[330px] shrink-0 border-b border-slate-700/50 bg-slate-900/20">
            {selectedData ? (
              <StockChart stockData={selectedData} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-slate-700 border-t-violet-500 rounded-full animate-spin" />
                    <span className="text-sm">Fetching market data…</span>
                  </>
                ) : (
                  <span className="text-sm">Select a stock to view its chart</span>
                )}
              </div>
            )}
          </div>

          {/* Category filter pills */}
          <CategoryFilter
            activeCategories={activeCategories}
            selected={filterCategory}
            onSelect={setFilterCategory}
            counts={categoryCounts}
          />

          {/* Watchlist */}
          <div className="flex-1 min-h-0 bg-slate-900/20">
            <WatchList
              data={data}
              watchlist={watchlist}
              selected={selected}
              onSelect={setSelected}
              onRemove={removeSymbol}
              getCategory={getCategory}
              setCategory={setCategory}
              filterCategory={filterCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
