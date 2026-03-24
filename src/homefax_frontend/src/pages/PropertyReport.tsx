import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { HomeFaxReport, formatCost, formatDate, CATEGORY_ICONS, CATEGORY_LABELS, getCategoryKey } from "../types";
import { RecordItem } from "../components/RecordItem";
import { AddRecordModal } from "../components/AddRecordModal";
import { CreateRecordArgs } from "../types";

interface PropertyReportProps {
  backend: any;
  currentPrincipal: string | null;
}

export function PropertyReport({ backend, currentPrincipal }: PropertyReportProps) {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<HomeFaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const isOwner = report && currentPrincipal
    ? report.property.owner.toText() === currentPrincipal
    : false;

  useEffect(() => {
    if (!backend || !id) return;
    loadReport();
  }, [backend, id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const result = await backend.getHomeFaxReport(BigInt(id!));
      if ("err" in result) {
        setError("Property not found.");
      } else {
        setReport(result.ok);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (args: CreateRecordArgs) => {
    const result = await backend.addMaintenanceRecord(args);
    if ("err" in result) throw new Error(JSON.stringify(result.err));
    setSuccessMsg("Record added!");
    setTimeout(() => setSuccessMsg(""), 3000);
    loadReport();
  };

  const handleDeleteRecord = async (recordId: bigint) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const result = await backend.deleteMaintenanceRecord(recordId);
    if ("err" in result) {
      alert("Failed to delete record: " + JSON.stringify(result.err));
    } else {
      loadReport();
    }
  };

  if (loading) return <div className="page"><div className="loading">Loading HomeFax report...</div></div>;
  if (error) return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h2>Property Not Found</h2>
        <p>{error}</p>
        <Link to="/search" className="btn btn-primary">Search Properties</Link>
      </div>
    </div>
  );
  if (!report) return null;

  const { property, records, totalCost } = report;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  records.forEach((r) => {
    const key = getCategoryKey(r.category);
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });

  return (
    <div className="page">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-header-left">
          <div className="report-badge">
            <span>🔗</span> HomeFax Report
          </div>
          <h1>{property.address}</h1>
          <p className="property-location">{property.city}, {property.state} {property.zipCode}</p>
        </div>
        <div className="report-header-right">
          {isOwner && (
            <button onClick={() => setShowAddRecord(true)} className="btn btn-primary">
              + Add Record
            </button>
          )}
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Property Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{property.yearBuilt.toString()}</div>
          <div className="stat-label">Year Built</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Number(property.squareFeet).toLocaleString()}</div>
          <div className="stat-label">Square Feet</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{records.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCost(totalCost)}</div>
          <div className="stat-label">Documented Spend</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="card">
          <h2>By Category</h2>
          <div className="category-grid">
            {Object.entries(categoryCounts).map(([key, count]) => (
              <div key={key} className="category-item">
                <span className="category-item-icon">{CATEGORY_ICONS[key]}</span>
                <span className="category-item-label">{CATEGORY_LABELS[key] || key}</span>
                <span className="category-item-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Records */}
      <div className="card">
        <h2>Maintenance History</h2>
        {records.length === 0 ? (
          <div className="empty-records">
            <p>No maintenance records yet.</p>
            {isOwner && (
              <button onClick={() => setShowAddRecord(true)} className="btn btn-outline btn-sm">
                Add First Record
              </button>
            )}
          </div>
        ) : (
          <div className="records-list">
            {[...records]
              .sort((a, b) => Number(b.datePerformed) - Number(a.datePerformed))
              .map((record) => (
                <RecordItem
                  key={record.id.toString()}
                  record={record}
                  canDelete={isOwner}
                  onDelete={handleDeleteRecord}
                />
              ))}
          </div>
        )}
      </div>

      {/* Blockchain Verification Footer */}
      <div className="blockchain-footer">
        <div className="blockchain-info">
          <span className="blockchain-icon">🔗</span>
          <div>
            <strong>Blockchain Verified</strong>
            <p>This report is stored immutably on the Internet Computer Protocol. Property ID: #{property.id.toString()}</p>
          </div>
        </div>
      </div>

      {showAddRecord && (
        <AddRecordModal
          propertyId={property.id}
          onClose={() => setShowAddRecord(false)}
          onSubmit={handleAddRecord}
        />
      )}
    </div>
  );
}
