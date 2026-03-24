import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Property } from "../types";
import { PropertyCard } from "../components/PropertyCard";
import { AddRecordModal } from "../components/AddRecordModal";
import { CreateRecordArgs } from "../types";

interface DashboardProps {
  backend: any;
  principal: string | null;
}

export function Dashboard({ backend, principal }: DashboardProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addRecordFor, setAddRecordFor] = useState<bigint | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!backend) return;
    loadProperties();
  }, [backend]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const result = await backend.getMyProperties();
      setProperties(result);
    } catch (err: any) {
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (args: CreateRecordArgs) => {
    const result = await backend.addMaintenanceRecord(args);
    if ("err" in result) {
      throw new Error(JSON.stringify(result.err));
    }
    setSuccessMsg("Record added successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (!backend) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Please sign in to view your dashboard.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Properties</h1>
          {principal && (
            <p className="principal-display">
              Principal: <span className="monospace">{principal.slice(0, 20)}...</span>
            </p>
          )}
        </div>
        <Link to="/register" className="btn btn-primary">
          + Register Property
        </Link>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading your properties...</div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h2>No properties yet</h2>
          <p>Register your first property to start building its verified history.</p>
          <Link to="/register" className="btn btn-primary">
            Register Your Home
          </Link>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map((p) => (
            <PropertyCard
              key={p.id.toString()}
              property={p}
              showActions
              onAddRecord={(id) => setAddRecordFor(id)}
            />
          ))}
        </div>
      )}

      {addRecordFor !== null && (
        <AddRecordModal
          propertyId={addRecordFor}
          onClose={() => setAddRecordFor(null)}
          onSubmit={handleAddRecord}
        />
      )}
    </div>
  );
}
