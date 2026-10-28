import React from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

export default function TicketFilters({
  filters,
  onFilterChange,
  onClearFilters,
  assignees = [],
  totalFiltered = 0,
}) {
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Waiting on Customer", label: "Waiting on Customer" },
    { value: "Resolved", label: "Resolved" },
  ];

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "Urgent", label: "Urgent" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const sortOptions = [
    { value: "updated", label: "Recently Updated" },
    { value: "priority", label: "Highest Priority" },
  ];

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.priority ||
      filters.assignee ||
      filters.sort !== "updated" ||
      filters.onlyOverdue
  );

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.assignee ? 1 : 0) +
    (filters.onlyOverdue ? 1 : 0) +
    (filters.sort !== "updated" ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6 space-y-3">
      {/* Search and Quick Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder="Search tickets by subject, customer name, or email..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort by:</span>
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange("sort", e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider pr-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className={`text-xs py-1.5 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer font-medium transition-colors ${
            filters.status
              ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange("priority", e.target.value)}
          className={`text-xs py-1.5 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer font-medium transition-colors ${
            filters.priority
              ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {priorityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => onFilterChange("assignee", e.target.value)}
          className={`text-xs py-1.5 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer font-medium transition-colors ${
            filters.assignee
              ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <option value="">All Assignees</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {/* Overdue Quick Toggle */}
        <button
          type="button"
          onClick={() => onFilterChange("onlyOverdue", !filters.onlyOverdue)}
          className={`text-xs py-1.5 px-3 rounded-lg border transition-colors font-medium flex items-center gap-1.5 ${
            filters.onlyOverdue
              ? "bg-amber-100 text-amber-900 border-amber-300 font-semibold shadow-sm"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span>⚠️ Overdue only</span>
        </button>

        {/* Active Filter Clear & Summary */}
        {hasActiveFilters && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
            </span>
            <button
              onClick={onClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
