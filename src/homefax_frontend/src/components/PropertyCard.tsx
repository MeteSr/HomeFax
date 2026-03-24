import React from "react";
import { Link } from "react-router-dom";
import { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  recordCount?: number;
  showActions?: boolean;
  onAddRecord?: (id: bigint) => void;
}

export function PropertyCard({ property, recordCount, showActions, onAddRecord }: PropertyCardProps) {
  return (
    <div className="property-card">
      <div className="property-card-header">
        <div className="property-address">
          <h3>{property.address}</h3>
          <p>{property.city}, {property.state} {property.zipCode}</p>
        </div>
        <div className={`visibility-badge ${property.isPublic ? "public" : "private"}`}>
          {property.isPublic ? "Public" : "Private"}
        </div>
      </div>

      <div className="property-meta">
        <div className="meta-item">
          <span className="meta-label">Built</span>
          <span className="meta-value">{property.yearBuilt.toString()}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Size</span>
          <span className="meta-value">{Number(property.squareFeet).toLocaleString()} sqft</span>
        </div>
        {recordCount !== undefined && (
          <div className="meta-item">
            <span className="meta-label">Records</span>
            <span className="meta-value">{recordCount}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-label">ID</span>
          <span className="meta-value monospace">#{property.id.toString()}</span>
        </div>
      </div>

      <div className="property-card-actions">
        <Link to={`/report/${property.id}`} className="btn btn-primary btn-sm">
          View Report
        </Link>
        {showActions && onAddRecord && (
          <button
            onClick={() => onAddRecord(property.id)}
            className="btn btn-outline btn-sm"
          >
            + Add Record
          </button>
        )}
      </div>
    </div>
  );
}
