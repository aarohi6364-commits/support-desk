const BASE_URL = "/api";

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        result?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error(`API Error [${options.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // GET /api/dashboard
  async getDashboard() {
    const res = await request("/dashboard");
    return res.data;
  },

  // GET /api/tickets?search=...&status=...&priority=...&assignee=...&sort=...
  async getTickets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }
    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.priority) {
      params.append("priority", filters.priority);
    }
    if (filters.assignee) {
      params.append("assignee", filters.assignee);
    }
    if (filters.sort) {
      params.append("sort", filters.sort);
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await request(`/tickets${query}`);
    return res.data;
  },

  // GET /api/tickets/:id
  async getTicket(id) {
    const res = await request(`/tickets/${id}`);
    return res.data;
  },

  // POST /api/tickets
  async createTicket(ticketData) {
    const res = await request("/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    });
    return res.data;
  },

  // PATCH /api/tickets/:id
  async updateTicket(id, updates) {
    const res = await request(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  // POST /api/tickets/:id/entries
  async addTicketEntry(id, { content, entry_type, author }) {
    const res = await request(`/tickets/${id}/entries`, {
      method: "POST",
      body: JSON.stringify({ content, entry_type, author }),
    });
    return res.data;
  },
};
