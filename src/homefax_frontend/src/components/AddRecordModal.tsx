import React, { useState } from "react";
import { CreateRecordArgs, MaintenanceCategory } from "../types";

interface AddRecordModalProps {
  propertyId: bigint;
  onClose: () => void;
  onSubmit: (args: CreateRecordArgs) => Promise<void>;
}

const CATEGORIES = [
  "Plumbing", "HVAC", "Electrical", "Roofing", "Foundation",
  "Appliances", "Landscaping", "Pest", "Inspection", "Renovation", "Other",
];

export function AddRecordModal({ propertyId, onClose, onSubmit }: AddRecordModalProps) {
  const [form, setForm] = useState({
    category: "Plumbing",
    title: "",
    description: "",
    contractor: "",
    cost: "",
    datePerformed: new Date().toISOString().split("T")[0],
    receiptHash: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    try {
      const category = { [form.category]: null } as unknown as MaintenanceCategory;
      const dateMs = new Date(form.datePerformed).getTime();

      const args: CreateRecordArgs = {
        propertyId,
        category,
        title: form.title.trim(),
        description: form.description.trim(),
        contractor: form.contractor.trim() ? [form.contractor.trim()] : [],
        cost: form.cost ? [BigInt(Math.round(parseFloat(form.cost) * 100))] : [],
        datePerformed: BigInt(dateMs),
        receiptHash: form.receiptHash.trim() ? [form.receiptHash.trim()] : [],
      };

      await onSubmit(args);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Maintenance Record</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Replaced water heater"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details about the work performed..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date Performed *</label>
              <input
                type="date"
                value={form.datePerformed}
                onChange={(e) => setForm({ ...form, datePerformed: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Cost (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contractor / Company</label>
            <input
              type="text"
              value={form.contractor}
              onChange={(e) => setForm({ ...form, contractor: e.target.value })}
              placeholder="ABC Plumbing Co."
            />
          </div>

          <div className="form-group">
            <label>Receipt Hash (SHA-256)</label>
            <input
              type="text"
              value={form.receiptHash}
              onChange={(e) => setForm({ ...form, receiptHash: e.target.value })}
              placeholder="Optional: hash of receipt document"
              className="monospace"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Saving..." : "Add Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
