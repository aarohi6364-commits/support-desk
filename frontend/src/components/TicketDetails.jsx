import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  User,
  Mail,
  Send,
  Lock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge, PriorityBadge, formatRelativeTime } from "./TicketTable.jsx";

export default function TicketDetails({
  ticketId,
  onClose,
  onTicketUpdated,
  api,
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Composer state
  const [entryType, setEntryType] = useState("public_reply");
  const [entryContent, setEntryContent] = useState("");
  const [authorName, setAuthorName] = useState("Support Agent");
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState("");

  // Inline edit state
  const [updatingField, setUpdatingField] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [activeTab, setActiveTab] = useState("conversation"); // 'conversation' | 'activity'

  useEffect(() => {
    if (!ticketId) return;
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getTicket(ticketId);
      setTicket(data);
      setAssigneeInput(data.assignee || "");
    } catch (err) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    if (!ticket) return;
    try {
      setUpdatingField(field);
      setUpdateError("");
      const updatedTicket = await api.updateTicket(ticket.id, { [field]: value });
      
      // Reload full ticket to get latest activity history & updated_at
      const refreshed = await api.getTicket(ticket.id);
      setTicket(refreshed);
      if (onTicketUpdated) onTicketUpdated(refreshed);
    } catch (err) {
      setUpdateError(err.message || `Failed to update ${field}`);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryContent.trim()) {
      setEntryError("Entry content cannot be empty");
      return;
    }

    try {
      setSubmittingEntry(true);
      setEntryError("");

      await api.addTicketEntry(ticket.id, {
        content: entryContent.trim(),
        entry_type: entryType,
        author: authorName.trim() || "Support Agent",
      });

      // Clear composer text
      setEntryContent("");

      // Refresh ticket details (includes new entry and updated activity history)
      const refreshed = await api.getTicket(ticket.id);
      setTicket(refreshed);
      if (onTicketUpdated) onTicketUpdated(refreshed);
    } catch (err) {
      setEntryError(err.message || "Failed to submit entry");
    } finally {
      setSubmittingEntry(false);
    }
  };

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
              #{ticketId}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-600">
              Ticket Details & Audit Trail
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTicket}
              disabled={loading}
              title="Refresh ticket"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading && !ticket ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Loading ticket details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Error loading ticket
            </h3>
            <p className="text-xs text-rose-600 mb-4">{error}</p>
            <button
              onClick={loadTicket}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto">
            {/* Overdue Warning Alert Banner */}
            {ticket.is_overdue && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-amber-900">
                    SLA Resolution Overdue
                  </strong>
                  <span>
                    This ticket was created more than 24 hours ago and has not been resolved. Immediate triage or customer follow-up is recommended.
                  </span>
                </div>
              </div>
            )}

            {/* Field update error banner */}
            {updateError && (
              <div className="mx-6 mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{updateError}</span>
              </div>
            )}

            {/* Ticket Subject and Description */}
            <div className="p-6 border-b border-slate-100">
              <h1 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                {ticket.subject}
              </h1>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Meta Properties and Inline Controls */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status Control */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={ticket.status}
                      disabled={updatingField === "status"}
                      onChange={(e) => handleUpdateField("status", e.target.value)}
                      className="w-full text-xs font-medium py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Waiting on Customer">Waiting on Customer</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    {updatingField === "status" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Priority Control */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Priority
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={ticket.priority}
                      disabled={updatingField === "priority"}
                      onChange={(e) => handleUpdateField("priority", e.target.value)}
                      className="w-full text-xs font-medium py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                    {updatingField === "priority" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Assignee Control */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Assignee
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={assigneeInput}
                      placeholder="Assign agent..."
                      onChange={(e) => setAssigneeInput(e.target.value)}
                      onBlur={() => {
                        if (assigneeInput.trim() !== (ticket.assignee || "")) {
                          handleUpdateField("assignee", assigneeInput.trim() || null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateField("assignee", assigneeInput.trim() || null);
                        }
                      }}
                      className="w-full text-xs font-medium py-1.5 px-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {updatingField === "assignee" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Customer & Timestamps Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ticket.customer}</span>
                  </div>
                  {ticket.customer_email && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`mailto:${ticket.customer_email}`}
                        className="hover:underline text-blue-600"
                      >
                        {ticket.customer_email}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <span title={`Created at ${ticket.created_at}`}>
                    Created {formatRelativeTime(ticket.created_at)}
                  </span>
                  <span>•</span>
                  <span title={`Updated at ${ticket.updated_at}`}>
                    Updated {formatRelativeTime(ticket.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversation vs Activity Tabs */}
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("conversation")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeTab === "conversation"
                        ? "bg-blue-100 text-blue-800"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversation & Notes</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.2 rounded-full border border-blue-200">
                      {ticket.entries?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeTab === "activity"
                        ? "bg-blue-100 text-blue-800"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Activity History</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.2 rounded-full border border-blue-200">
                      {ticket.activities?.length || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Conversation & Notes */}
              {activeTab === "conversation" && (
                <div className="space-y-6">
                  {/* Entries List */}
                  {ticket.entries && ticket.entries.length > 0 ? (
                    <div className="space-y-4">
                      {ticket.entries.map((entry) => {
                        const isNote = entry.entry_type === "internal_note";

                        return (
                          <div
                            key={entry.id}
                            className={`rounded-xl border p-4 text-xs transition-all shadow-xs ${
                              isNote
                                ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/20"
                                : "bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-inherit/40">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    isNote
                                      ? "bg-amber-200 text-amber-800"
                                      : "bg-blue-600 text-white"
                                  }`}
                                >
                                  {isNote ? (
                                    <Lock className="w-3 h-3" />
                                  ) : (
                                    entry.author.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="font-semibold text-slate-900">
                                  {entry.author}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isNote
                                      ? "bg-amber-200/80 text-amber-900 border border-amber-300"
                                      : "bg-blue-100 text-blue-800 border border-blue-300"
                                  }`}
                                >
                                  {isNote ? "🔒 Internal Note" : "Public Reply"}
                                </span>
                              </div>

                              <span className="text-[11px] text-slate-400">
                                {formatRelativeTime(entry.created_at)}
                              </span>
                            </div>

                            <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                              {entry.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No public replies or internal notes yet. Use the composer below to respond.
                    </div>
                  )}

                  {/* Message Composer */}
                  <form
                    onSubmit={handleAddEntry}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                  >
                    {/* Mode Toggle Bar */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEntryType("public_reply")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            entryType === "public_reply"
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-200/60"
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Public Reply</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEntryType("internal_note")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                            entryType === "internal_note"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-200/60"
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Internal Note</span>
                        </button>
                      </div>

                      {/* Author selector */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="text-[11px]">As:</span>
                        <input
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Agent name"
                          className="w-28 px-2 py-0.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Mode Banner Indicator */}
                    <div
                      className={`px-4 py-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
                        entryType === "public_reply"
                          ? "bg-blue-50 text-blue-700 border-b border-blue-100"
                          : "bg-amber-50 text-amber-800 border-b border-amber-200"
                      }`}
                    >
                      {entryType === "public_reply" ? (
                        <>
                          <MessageSquare className="w-3 h-3 text-blue-600" />
                          <span>
                            Visible to the customer. They will receive this response.
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>
                            Private note. Only visible to internal support teammates.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Composer Textarea */}
                    <div className="p-3">
                      <textarea
                        rows={3}
                        value={entryContent}
                        onChange={(e) => {
                          setEntryContent(e.target.value);
                          if (entryError) setEntryError("");
                        }}
                        placeholder={
                          entryType === "public_reply"
                            ? "Type a public response to the customer..."
                            : "Add internal investigation notes, log excerpts, or handover remarks..."
                        }
                        className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-y"
                      />
                    </div>

                    {entryError && (
                      <div className="px-3 pb-2 text-[11px] text-rose-600 font-medium">
                        {entryError}
                      </div>
                    )}

                    {/* Submit Bar */}
                    <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Press Send to append to ticket timeline
                      </span>
                      <button
                        type="submit"
                        disabled={submittingEntry || !entryContent.trim()}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
                          entryType === "public_reply"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                      >
                        {submittingEntry ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {entryType === "public_reply"
                                ? "Send Reply"
                                : "Save Internal Note"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Activity History Timeline */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  {ticket.activities && ticket.activities.length > 0 ? (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {ticket.activities.map((act) => {
                        let Icon = Clock;
                        let iconBg = "bg-slate-100 text-slate-600";

                        if (act.action === "created") {
                          Icon = PlusCircle;
                          iconBg = "bg-blue-100 text-blue-600";
                        } else if (act.action === "status_changed") {
                          Icon = RefreshCw;
                          iconBg = "bg-purple-100 text-purple-600";
                        } else if (act.action === "priority_changed") {
                          Icon = AlertOctagon;
                          iconBg = "bg-rose-100 text-rose-600";
                        } else if (act.action === "assignee_changed") {
                          Icon = User;
                          iconBg = "bg-indigo-100 text-indigo-600";
                        } else if (act.action === "reply_added") {
                          Icon = MessageSquare;
                          iconBg = "bg-sky-100 text-sky-600";
                        } else if (act.action === "internal_note_added") {
                          Icon = Lock;
                          iconBg = "bg-amber-100 text-amber-600";
                        }

                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot icon */}
                            <div
                              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${iconBg}`}
                            >
                              <Icon className="w-2.5 h-2.5" />
                            </div>

                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2.5 text-xs">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span className="font-semibold text-slate-700 capitalize">
                                  {act.action.replace("_", " ")}
                                </span>
                                <span>{formatRelativeTime(act.created_at)}</span>
                              </div>
                              <p className="text-slate-800 text-xs font-medium">
                                {act.details}
                              </p>
                              <div className="mt-1 text-[10px] text-slate-400">
                                Triggered by: {act.author}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No activity recorded for this ticket yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
