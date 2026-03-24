import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface RegisterPropertyProps {
  backend: any;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC"
];

export function RegisterProperty({ backend }: RegisterPropertyProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "CA",
    zipCode: "",
    yearBuilt: "",
    squareFeet: "",
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.address || !form.city || !form.zipCode || !form.yearBuilt || !form.squareFeet) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await backend.registerProperty({
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state,
        zipCode: form.zipCode.trim(),
        yearBuilt: BigInt(form.yearBuilt),
        squareFeet: BigInt(form.squareFeet),
        isPublic: form.isPublic,
      });

      if ("err" in result) {
        throw new Error(JSON.stringify(result.err));
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Register Property</h1>
        <p>Add your property to the HomeFax blockchain.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Street Address *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label>City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="San Francisco"
                required
              />
            </div>
            <div className="form-group">
              <label>State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>ZIP Code *</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                placeholder="94105"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year Built *</label>
              <input
                type="number"
                value={form.yearBuilt}
                onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })}
                placeholder="1995"
                min="1800"
                max={new Date().getFullYear()}
                required
              />
            </div>
            <div className="form-group">
              <label>Square Feet *</label>
              <input
                type="number"
                value={form.squareFeet}
                onChange={(e) => setForm({ ...form, squareFeet: e.target.value })}
                placeholder="1800"
                min="100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <span>Make property report public</span>
              <div className="toggle-description">
                Public reports can be viewed by buyers and agents without authentication.
              </div>
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/dashboard")} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Registering..." : "Register Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
