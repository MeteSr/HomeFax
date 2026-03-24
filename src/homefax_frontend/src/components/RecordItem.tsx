import React, { useState } from "react";
import { MaintenanceRecord, CATEGORY_ICONS, CATEGORY_LABELS, getCategoryKey, formatCost, formatDate } from "../types";

interface RecordItemProps {
  record: MaintenanceRecord;
  canDelete?: boolean;
  onDelete?: (id: bigint) => void;
}

export function RecordItem({ record, canDelete, onDelete }: RecordItemProps) {
  const [expanded, setExpanded] = useState(false);
  const categoryKey = getCategoryKey(record.category);
  const icon = CATEGORY_ICONS[categoryKey] || "📋";
  const label = CATEGORY_LABELS[categoryKey] || categoryKey;

  return (
    <div className="record-item">
      <div className="record-header" onClick={() => setExpanded(!expanded)}>
        <div className="record-icon">{icon}</div>
        <div className="record-summary">
          <div className="record-title">{record.title}</div>
          <div className="record-meta">
            <span className="category-badge">{label}</span>
            <span className="record-date">{formatDate(record.datePerformed)}</span>
            {record.cost[0] !== undefined && (
              <span className="record-cost">{formatCost(record.cost[0])}</span>
            )}
          </div>
        </div>
        <div className="record-actions">
          {record.verified && <span className="verified-badge">✓ Verified</span>}
          <span className="expand-icon">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="record-details">
          {record.description && (
            <div className="detail-row">
              <span className="detail-label">Description</span>
              <span className="detail-value">{record.description}</span>
            </div>
          )}
          {record.contractor[0] && (
            <div className="detail-row">
              <span className="detail-label">Contractor</span>
              <span className="detail-value">{record.contractor[0]}</span>
            </div>
          )}
          {record.receiptHash[0] && (
            <div className="detail-row">
              <span className="detail-label">Receipt Hash</span>
              <span className="detail-value monospace hash">{record.receiptHash[0]}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Record ID</span>
            <span className="detail-value monospace">#{record.id.toString()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Added</span>
            <span className="detail-value">{formatDate(record.createdAt / BigInt(1_000_000))}</span>
          </div>
          {canDelete && onDelete && (
            <div className="detail-actions">
              <button
                onClick={() => onDelete(record.id)}
                className="btn btn-danger btn-sm"
              >
                Delete Record
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
