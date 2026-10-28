import React, { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "./components/Sidebar.jsx";
import StatsCards from "./components/StatsCards.jsx";
import TicketFilters from "./components/TicketFilters.jsx";
import TicketTable from "./components/TicketTable.jsx";
import CreateTicketModal from "./components/CreateTicketModal.jsx";
import TicketDetails from "./components/TicketDetails.jsx";
import { api } from "./services/api.js";
import {
  Plus,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertCircle,
  Menu,
  X,
  LifeBuoy,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard & Tickets Data
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorTickets, setErrorTickets] = useState("");

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignee: "",
    sort: "updated",
    onlyOverdue: false,
  });

  // Modal & Details View State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Dashboard Statistics
  const loadDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load Tickets List based on active filters
  const loadTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      setErrorTickets("");
      const data = await api.getTickets({
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        assignee: filters.assignee,
        sort: filters.sort,
      });
      setTickets(data);
    } catch (err) {
      setErrorTickets(err.message || "Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [filters.search, filters.status, filters.priority, filters.assignee, filters.sort]);

  // Initial load
  useEffect(() => {
    loadDashboardStats();
    loadTickets();
  }, [loadDashboardStats, loadTickets]);

  // Extract unique assignees from ticket list for filter dropdown
  const uniqueAssignees = useMemo(() => {
    const set = new Set();
    tickets.forEach((t) => {
      if (t.assignee && t.assignee.trim()) {
        set.add(t.assignee.trim());
      }
    });
    // Add known common defaults if list is small
    ["Support Agent", "Michael Scott", "Emily Davis", "Alex Rivera"].forEach(
      (name) => set.add(name)
    );
    return Array.from(set).sort();
  }, [tickets]);

  // Client-side overdue filter if enabled
  const displayedTickets = useMemo(() => {
    if (!filters.onlyOverdue) return tickets;
    return tickets.filter((t) => {
      if (t.is_overdue) return true;
      if (t.status === "Resolved") return false;
      const created = new Date(t.created_at);
      const now = new Date();
      return now - created > 24 * 60 * 60 * 1000;
    });
  }, [tickets, filters.onlyOverdue]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      assignee: "",
      sort: "updated",
      onlyOverdue: false,
    });
  };

  // Handle Quick filter by clicking a Stat Card
  const handleSelectStatCard = (card) => {
    if (card.filterType === "status") {
      setFilters((prev) => ({
        ...prev,
        status: prev.status === card.filterValue ? "" : card.filterValue,
        onlyOverdue: false,
      }));
    } else if (card.filterType === "priority") {
      setFilters((prev) => ({
        ...prev,
        priority: prev.priority === card.filterValue ? "" : card.filterValue,
        onlyOverdue: false,
      }));
    } else if (card.filterType === "special" && card.filterValue === "overdue") {
      setFilters((prev) => ({
        ...prev,
        onlyOverdue: !prev.onlyOverdue,
      }));
    }
  };

  // Handle ticket creation
  const handleCreateTicket = async (ticketData) => {
    const newTicket = await api.createTicket(ticketData);
    showToast(`Ticket #${newTicket.id} created successfully!`, "success");
    // Refresh both list and dashboard counts
    await Promise.all([loadTickets(), loadDashboardStats()]);
    // Automatically select the newly created ticket to inspect
    setSelectedTicketId(newTicket.id);
  };

  // Handle ticket update from details panel
  const handleTicketUpdated = async (updatedTicket) => {
    showToast(`Ticket #${updatedTicket.id} updated!`, "success");
    // Refresh background list and stats so changes reflect instantly
    loadTickets();
    loadDashboardStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-700"
                : "bg-rose-900 text-white border-rose-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Responsive Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeFilter={filters}
          onSelectFilter={(newFilters) => {
            setFilters((prev) => ({
              ...prev,
              ...newFilters,
            }));
          }}
          stats={stats}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm flex">
          <div className="relative w-64">
            <Sidebar
              activeFilter={filters}
              onSelectFilter={(newFilters) => {
                setFilters((prev) => ({
                  ...prev,
                  ...newFilters,
                }));
                setSidebarOpen(false);
              }}
              stats={stats}
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Support Operations Dashboard</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Real-time queue monitoring, SLAs & response coordination
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Refresh Button */}
            <button
              onClick={() => {
                loadDashboardStats();
                loadTickets();
                showToast("Refreshed tickets and metrics", "success");
              }}
              title="Refresh queue and dashboard"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingStats || loadingTickets ? "animate-spin text-blue-600" : ""
                }`}
              />
            </button>

            {/* Primary New Ticket Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Section 1: Dashboard Statistics Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Performance Metrics & Status
                </h2>
                <p className="text-xs text-slate-400">
                  Live stats from <code className="text-[11px] text-blue-600">GET /api/dashboard</code>
                </p>
              </div>
            </div>

            <StatsCards
              stats={stats}
              loading={loadingStats}
              activeFilter={filters}
              onSelectFilter={handleSelectStatCard}
            />
          </div>

          {/* Section 2: Ticket Queue & Filters */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Ticket Queue
                </h2>
                <p className="text-xs text-slate-400">
                  Search, filter, and inspect tickets in real-time
                </p>
              </div>
            </div>

            {/* Filter Toolbar */}
            <TicketFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              assignees={uniqueAssignees}
              totalFiltered={displayedTickets.length}
            />

            {/* Ticket Table */}
            <TicketTable
              tickets={displayedTickets}
              loading={loadingTickets}
              error={errorTickets}
              selectedTicketId={selectedTicketId}
              onSelectTicket={(id) => setSelectedTicketId(id)}
              onResetFilters={handleClearFilters}
              onNewTicketClick={() => setIsCreateModalOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Ticket Details Side Panel / Drawer */}
      {selectedTicketId && (
        <TicketDetails
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={handleTicketUpdated}
          api={api}
        />
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
        assignees={uniqueAssignees}
      />
    </div>
  );
}
