import React from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Layers,
} from "lucide-react";

export default function StatsCards({ stats, loading, activeFilter, onSelectFilter }) {
  const cards = [
    {
      id: "all",
      key: "totalTickets",
      title: "Total Tickets",
      value: stats?.totalTickets ?? 0,
      description: "All tickets across all statuses",
      icon: Layers,
      color: "blue",
      filterType: "status",
      filterValue: "",
      bgLight: "bg-blue-50/70",
      borderLight: "border-blue-100",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100/80",
    },
    {
      id: "open",
      key: "openTickets",
      title: "Open Tickets",
      value: stats?.openTickets ?? 0,
      description: "Awaiting agent triage or response",
      icon: Inbox,
      color: "sky",
      filterType: "status",
      filterValue: "Open",
      bgLight: "bg-sky-50/70",
      borderLight: "border-sky-100",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-100/80",
    },
    {
      id: "in_progress",
      key: "inProgressTickets",
      title: "In Progress",
      value: stats?.inProgressTickets ?? 0,
      description: "Currently under active investigation",
      icon: Clock,
      color: "indigo",
      filterType: "status",
      filterValue: "In Progress",
      bgLight: "bg-indigo-50/70",
      borderLight: "border-indigo-100",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100/80",
    },
    {
      id: "resolved",
      key: "resolvedTickets",
      title: "Resolved Tickets",
      value: stats?.resolvedTickets ?? 0,
      description: "Successfully addressed issues",
      icon: CheckCircle2,
      color: "emerald",
      filterType: "status",
      filterValue: "Resolved",
      bgLight: "bg-emerald-50/70",
      borderLight: "border-emerald-100",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100/80",
    },
    {
      id: "urgent",
      key: "urgentTickets",
      title: "Urgent Tickets",
      value: stats?.urgentTickets ?? 0,
      description: "Critical priority requiring immediate action",
      icon: AlertOctagon,
      color: "rose",
      filterType: "priority",
      filterValue: "Urgent",
      bgLight: "bg-rose-50/70",
      borderLight: "border-rose-100",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100/80",
    },
    {
      id: "overdue",
      key: "overdueTickets",
      title: "Overdue Tickets",
      value: stats?.overdueTickets ?? 0,
      description: "Open >24h without resolution",
      icon: AlertTriangle,
      color: "amber",
      filterType: "special",
      filterValue: "overdue",
      bgLight: "bg-amber-50/70",
      borderLight: "border-amber-200",
      iconColor: "text-amber-700",
      iconBg: "bg-amber-100",
      warningBadge: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.filterType === "status" && activeFilter?.status === card.filterValue) ||
          (card.filterType === "priority" && activeFilter?.priority === card.filterValue) ||
          (card.filterType === "special" && activeFilter?.onlyOverdue);

        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter && onSelectFilter(card)}
            className={`relative rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
              isSelected
                ? "ring-2 ring-blue-600 border-transparent bg-blue-50/30"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              {loading ? (
                <div className="h-8 w-14 bg-slate-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </div>
              )}

              {card.warningBadge && card.value > 0 && !loading && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  Action SLA
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] text-slate-500 leading-tight truncate">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
