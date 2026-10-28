import React from "react";
import {
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Inbox,
  AlertCircle,
  Mail,
} from "lucide-react";

export function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function StatusBadge({ status }) {
  const styles = {
    Open: "bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20",
    "In Progress": "bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20",
    "Waiting on Customer": "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
  };

  const dots = {
    Open: "bg-sky-500",
    "In Progress": "bg-indigo-500",
    "Waiting on Customer": "bg-amber-500",
    Resolved: "bg-emerald-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dots[status] || "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    Urgent: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-blue-50 text-blue-700 border-blue-200",
    Low: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
        styles[priority] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {priority}
    </span>
  );
}

export default function TicketTable({
  tickets = [],
  loading,
  error,
  onSelectTicket,
  selectedTicketId,
  onResetFilters,
  onNewTicketClick,
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(6);

  // Reset page when tickets change (e.g. search/filter applied)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [tickets.length]);

  const totalPages = Math.ceil(tickets.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, tickets.length);
  const currentTickets = tickets.slice(startIndex, endIndex);
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="p-4 flex items-center gap-4">
              <div className="h-4 w-10 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto" />
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-rose-900 mb-1">
          Failed to load tickets
        </h3>
        <p className="text-sm text-rose-700 mb-4 max-w-md mx-auto">{error}</p>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No tickets found
        </h3>
        <p className="text-sm text-slate-500 mb-5 max-w-sm mx-auto">
          No support tickets matched your current search criteria or filter
          conditions.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onResetFilters}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={onNewTicketClick}
            className="px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Create New Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Summary */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>
          Showing <strong className="text-slate-900">{tickets.length}</strong> tickets
        </span>
        <span className="text-slate-400">Click any ticket row to view details & replies</span>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-5 w-20">ID</th>
              <th className="py-3 px-4">Subject & Description</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4 text-right">Updated</th>
              <th className="py-3 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {currentTickets.map((ticket) => {
              const isSelected = selectedTicketId === ticket.id;
              // Check overdue rule: not Resolved and created > 24 hours ago
              const isOverdue =
                ticket.is_overdue ||
                (ticket.status !== "Resolved" &&
                  new Date() - new Date(ticket.created_at) > 24 * 60 * 60 * 1000);

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50/70 hover:bg-blue-50"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  {/* Ticket ID */}
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-500">
                    #{ticket.id}
                  </td>

                  {/* Subject & snippet */}
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {ticket.subject}
                      </span>
                      {isOverdue && (
                        <span
                          title="Overdue: Created more than 24h ago and not resolved"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5 line-clamp-1">
                      {ticket.description}
                    </p>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="text-xs font-medium text-slate-800">
                      {ticket.customer}
                    </div>
                    {ticket.customer_email && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {ticket.customer_email}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {ticket.assignee.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[110px]">
                          {ticket.assignee}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Last updated */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap text-xs text-slate-500">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatRelativeTime(ticket.updated_at)}</span>
                    </div>
                  </td>

                  {/* Arrow Action */}
                  <td className="py-3.5 px-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {tickets.length > 0 && (
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong className="text-slate-900 font-semibold">
                {startIndex + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-900 font-semibold">
                {endIndex}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-900 font-semibold">
                {tickets.length}
              </strong>{" "}
              tickets
            </span>

            <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
              <span className="text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-xs font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
