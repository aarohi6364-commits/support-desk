import React from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Layers,
  LifeBuoy,
  ShieldCheck,
  Database,
} from "lucide-react";

export default function Sidebar({
  activeFilter,
  onSelectFilter,
  stats,
}) {
  const queueViews = [
    {
      id: "all",
      label: "All Tickets",
      icon: Layers,
      count: stats?.totalTickets ?? 0,
      filter: { status: "", priority: "", onlyOverdue: false },
      badgeClass: "bg-slate-800 text-slate-300",
    },
    {
      id: "open",
      label: "Open Tickets",
      icon: Inbox,
      count: stats?.openTickets ?? 0,
      filter: { status: "Open", priority: "", onlyOverdue: false },
      badgeClass: "bg-sky-950 text-sky-400 border border-sky-800",
    },
    {
      id: "in_progress",
      label: "In Progress",
      icon: Clock,
      count: stats?.inProgressTickets ?? 0,
      filter: { status: "In Progress", priority: "", onlyOverdue: false },
      badgeClass: "bg-indigo-950 text-indigo-400 border border-indigo-800",
    },
    {
      id: "urgent",
      label: "Urgent Priority",
      icon: AlertOctagon,
      count: stats?.urgentTickets ?? 0,
      filter: { status: "", priority: "Urgent", onlyOverdue: false },
      badgeClass: "bg-rose-950 text-rose-400 border border-rose-800",
    },
    {
      id: "overdue",
      label: "Overdue (>24h)",
      icon: AlertTriangle,
      count: stats?.overdueTickets ?? 0,
      filter: { status: "", priority: "", onlyOverdue: true },
      badgeClass: "bg-amber-950 text-amber-400 border border-amber-800",
      warning: true,
    },
    {
      id: "resolved",
      label: "Resolved",
      icon: CheckCircle2,
      count: stats?.resolvedTickets ?? 0,
      filter: { status: "Resolved", priority: "", onlyOverdue: false },
      badgeClass: "bg-emerald-950 text-emerald-400 border border-emerald-800",
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-tight text-sm">
            SupportDesk
          </h1>
          <span className="text-[11px] text-slate-400 block -mt-0.5">
            Agent Ticket Portal
          </span>
        </div>
      </div>

      {/* Queue Views Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Ticket Queues
        </div>

        {queueViews.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === "all" &&
              !activeFilter.status &&
              !activeFilter.priority &&
              !activeFilter.onlyOverdue) ||
            (item.id === "open" &&
              activeFilter.status === "Open" &&
              !activeFilter.onlyOverdue) ||
            (item.id === "in_progress" &&
              activeFilter.status === "In Progress" &&
              !activeFilter.onlyOverdue) ||
            (item.id === "urgent" &&
              activeFilter.priority === "Urgent" &&
              !activeFilter.onlyOverdue) ||
            (item.id === "overdue" && activeFilter.onlyOverdue) ||
            (item.id === "resolved" &&
              activeFilter.status === "Resolved" &&
              !activeFilter.onlyOverdue);

          return (
            <button
              key={item.id}
              onClick={() => onSelectFilter && onSelectFilter(item.filter)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-white"
                      : item.warning && item.count > 0
                      ? "text-amber-400 animate-pulse"
                      : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <span
                className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full ${
                  isActive ? "bg-blue-700 text-white" : item.badgeClass
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          System Rules
        </div>
        <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>SLA: Overdue if &gt;24h &amp; Unresolved</span>
        </div>
        <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span>SQLite: WAL &amp; Cascades Enabled</span>
        </div>
      </div>

      {/* Agent Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-semibold text-white text-xs border border-blue-400/30">
              SA
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              Support Agent
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              Local Support Workspace
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
