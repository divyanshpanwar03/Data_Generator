import React, { useState, useEffect, useRef } from "react";
import { api } from "../hooks/api";
import { Card, Input, SectionHeader, Toast } from "../components/UI";
import "./NewProjectPage.css";

// --- TEMPLATE DICTIONARY ---
// Add any new templates you make right here. The dropdown will map them automatically!
const INDUSTRY_META = {
  saas: { name: "SaaS", desc: "Subscription software with recurring revenue" },
  cpg: { name: "CPG", desc: "FMCG manufacturer with retail distribution" },
  retail: { name: "Retail", desc: "Omnichannel retailer with physical and digital channels" },
  healthcare: { name: "Healthcare", desc: "Hospital networks and clinic operations" }
};

const PRODUCTS = ["Footwear", "Apparel", "Enterprise", "Pro Plan", "Beauty & Health", "Home & Living", "Accessories"];
const REGIONS = ["North America", "EMEA", "APAC", "LATAM"];
const CHANNELS = ["Direct", "Wholesale", "Partner Network", "Self-Serve", "Marketplace"];
const DIMENSIONS = ["product", "region", "channel", "scenario"];

// --- MULTI-SELECT MODAL (Products, Regions, Channels) ---
function MultiSelectDropdown({ label, options = [], selected = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [maxVisible, setMaxVisible] = useState(3);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(x => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleAdd = () => {
    const val = inputValue.trim();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
    }
    setInputValue("");
  };

  const remove = (e, opt) => {
    e.stopPropagation();
    onChange(selected.filter(x => x !== opt));
  };

  const handleMaxChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setMaxVisible(isNaN(val) || val < 0 ? 0 : val);
  };

  const visibleSelected = selected.slice(0, maxVisible);
  const hiddenCount = selected.length - maxVisible;

  return (
    <div className="multi-select-container">
      {/* HEADER WITH LABEL & LIMIT INPUT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label className="input-label" style={{ marginBottom: 0, fontWeight: 700, color: '#334155', fontSize: '13px', textTransform: 'uppercase' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          <label>Visible limit:</label>
          <input
            type="number"
            min="0"
            value={maxVisible}
            onChange={handleMaxChange}
            onClick={(e) => e.stopPropagation()}
            className="chip-limit-input"
          />
        </div>
      </div>

      {/* CHIP BOX */}
      <div className="multi-select-box" onClick={() => setIsOpen(true)}>
        <div className="selected-chips">
          {visibleSelected.map(opt => (
            <span key={opt} className="chip">
              {opt}
              <button className="chip-remove" onClick={(e) => remove(e, opt)}>×</button>
            </span>
          ))}
          
          {hiddenCount > 0 && (
            <span
              className="chip chip-more"
              onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            >
              +{hiddenCount} more
            </span>
          )}
          
          {selected.length === 0 && <span className="placeholder">Select options...</span>}
        </div>
        <div className="chevron">✎ Edit</div>
      </div>

      {/* MODAL WINDOW */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)} style={{ zIndex: 9999 }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            
            <div className="modal-header">
              <div>
                <h2>Manage {label}</h2>
                <p className="modal-desc">Select or add custom items to your generation list.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '0 24px 24px' }}>
              <div className="multi-select-add">
                <input
                  type="text"
                  placeholder="Type custom item and press Add..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button type="button" onClick={handleAdd}>Add</button>
              </div>

              <div className="multi-select-options">
                {selected.map(opt => (
                  <label key={opt} className="checkbox-list-item">
                    <input type="checkbox" checked={true} onChange={() => toggleOption(opt)} />
                    <span className="checkbox-item-text">{opt}</span>
                  </label>
                ))}
                {options.filter(o => !selected.includes(o)).map(opt => (
                  <label key={opt} className="checkbox-list-item">
                    <input type="checkbox" checked={false} onChange={() => toggleOption(opt)} />
                    <span className="checkbox-item-text">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button className="btn-primary" onClick={() => setIsOpen(false)} style={{ width: '100%' }}>
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// --- SIMPLE DROPDOWN ---
function SimpleDropdown({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="input-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700, color: '#334155', fontSize: '13px', textTransform: 'uppercase' }}>{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="simple-dropdown-select"
      >
        {options.map(o => <option key={o} value={o}>{o.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
      </select>
    </div>
  );
}

export default function NewProjectPage({ navigate }) {
  const [form, setForm] = useState({
    name: "New FP&A Model",
    industry: "saas",
    dimensions: [...DIMENSIONS],
    products: ["Enterprise", "Pro Plan"],
    regions: ["North America", "EMEA"],
    channels: ["Direct", "Partner Network"],
  });

  const [overrides, setOverrides] = useState({
    seasonality: "moderate",
    inflation: "medium"
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const templateOptions = {
    seasonality: ["flat", "moderate", "high_holiday", "summer_peak"],
    inflation: ["none", "low", "medium", "high_volatile"]
  };

  const submit = async () => {
    if (!form.name.trim()) return setToast({ msg: "Project name is required", type: "error" });
    setSaving(true);
    try {
      const p = await api.createProject({
        name: form.name,
        industry: form.industry,
        custom_dimensions: {
          product: form.products,
          region: form.regions,
          channel: form.channels,
          ...overrides
        }
      });
      navigate("project-detail", { projectId: p.id });
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="np-container">
      <button onClick={() => navigate("projects")} className="back-btn">← Back to Projects</button>
      <SectionHeader title="Create New Project" subtitle="Configure a new synthetic data generation environment." />

      {/* --- ASYMMETRIC LAYOUT (35% Left / 65% Right) --- */}
      <div className="np-layout-split">
        
        {/* LEFT COLUMN: Name & Industry (Narrower) */}
        <div className="np-left-col">
          <Input 
            label="Project Name" 
            value={form.name} 
            onChange={(v) => setForm({ ...form, name: v })} 
            placeholder="e.g. Q3 SaaS Forecasting" 
          />

          <div style={{ marginTop: '32px' }}>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
              Select Industry Blueprint
            </label>
            
            {/* NEW SCALABLE TEMPLATE DROPDOWN */}
            <select 
              value={form.industry} 
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="simple-dropdown-select"
              style={{ marginBottom: '8px', padding: '12px 14px', fontSize: '15px' }}
            >
              {Object.keys(INDUSTRY_META).map(key => (
                <option key={key} value={key}>{INDUSTRY_META[key].name}</option>
              ))}
            </select>
            
            <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', paddingLeft: '4px' }}>
              {INDUSTRY_META[form.industry]?.desc}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Blueprint Configuration (Wider) */}
        <div className="np-right-col">
          <h2 className="blueprint-title">Blueprint Configuration</h2>
          <p className="blueprint-subtitle">Define dimensions and macroeconomic assumptions.</p>
          
          <div className="blueprint-sections">
            
            {/* Card 1: Dimensional Hierarchy */}
            <div className="config-card">
              <h3 className="section-label">Dimensional Hierarchy</h3>
              <MultiSelectDropdown label="Active Products" options={PRODUCTS} selected={form.products} onChange={v => setForm({ ...form, products: v })} />
              <MultiSelectDropdown label="Active Regions" options={REGIONS} selected={form.regions} onChange={v => setForm({ ...form, regions: v })} />
              <MultiSelectDropdown label="Sales Channels" options={CHANNELS} selected={form.channels} onChange={v => setForm({ ...form, channels: v })} />
            </div>

            {/* Card 2: Macroeconomic Overrides */}
            <div className="config-card">
              <h3 className="section-label">Macroeconomic Overrides</h3>
              <SimpleDropdown
                label="Default Seasonality Profile"
                value={overrides.seasonality}
                options={templateOptions.seasonality}
                onChange={(val) => setOverrides(o => ({ ...o, seasonality: val }))}
              />
              <SimpleDropdown
                label="Baseline Inflation Preset"
                value={overrides.inflation}
                options={templateOptions.inflation}
                onChange={(val) => setOverrides(o => ({ ...o, inflation: val }))}
              />
            </div>
            
          </div>

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => navigate("projects")} disabled={saving}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submit} disabled={saving || !form.industry}>
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>

      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}