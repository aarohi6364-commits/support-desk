import React, { useState } from "react";
import { X, AlertCircle, Loader2, Plus, Sparkles } from "lucide-react";

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit,
  assignees = [],
}) {
  const [formData, setFormData] = useState({
    subject: "",
    customer: "",
    customer_email: "",
    description: "",
    priority: "Medium",
    status: "Open",
    assignee: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) {
      errs.subject = "Subject is required";
    }
    if (!formData.customer.trim()) {
      errs.customer = "Customer name is required";
    }
    if (!formData.customer_email.trim()) {
      errs.customer_email = "Customer email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customer_email.trim())) {
        errs.customer_email = "Enter a valid email address (e.g. name@domain.com)";
      }
    }
    if (!formData.description.trim()) {
      errs.description = "Ticket description is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      await onSubmit({
        subject: formData.subject.trim(),
        customer: formData.customer.trim(),
        customer_email: formData.customer_email.trim().toLowerCase(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        assignee: formData.assignee.trim() || null,
      });

      // Reset form and close
      setFormData({
        subject: "",
        customer: "",
        customer_email: "",
        description: "",
        priority: "Medium",
        status: "Open",
        assignee: "",
      });
      setErrors({});
      onClose();
    } catch (err) {
      setServerError(err.message || "Failed to create ticket. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Create New Support Ticket
              </h2>
              <p className="text-xs text-slate-500">
                Log an incoming customer inquiry or issue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Cannot access billing portal invoice records"
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.subject
                  ? "border-rose-400 focus:ring-rose-500/30"
                  : "border-slate-300 focus:ring-blue-600 focus:border-blue-600"
              }`}
            />
            {errors.subject && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Customer Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                placeholder="e.g. Sarah Connor"
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.customer
                    ? "border-rose-400 focus:ring-rose-500/30"
                    : "border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                }`}
              />
              {errors.customer && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.customer}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="e.g. sarah@skynet.com"
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.customer_email
                    ? "border-rose-400 focus:ring-rose-500/30"
                    : "border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                }`}
              />
              {errors.customer_email && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {errors.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide complete details, steps to reproduce, or relevant background..."
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all resize-y ${
                errors.description
                  ? "border-rose-400 focus:ring-rose-500/30"
                  : "border-slate-300 focus:ring-blue-600 focus:border-blue-600"
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Priority, Status, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on Customer">Waiting on Customer</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee
              </label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                list="assignees-list"
                placeholder="e.g. Michael Scott"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <datalist id="assignees-list">
                {assignees.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Ticket...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
