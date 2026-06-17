import React, { useState, useEffect, useMemo } from "react";
import "./NewDatasetPage.css";
import { api } from "../hooks/api";

const parseSafeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data.replace(/'/g, '"')); } catch (e) { return []; }
  }
  return [];
};

// --- REUSABLE COMPONENT: MultiSelectDropdown ---
function MultiSelectDropdown({ label, options = [], selected = [], onChange, onAddCustom }) {
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
    if (val) {
      if (onAddCustom) {
        onAddCustom(val);
      } else if (!selected.includes(val)) {
        onChange([...selected, val]);
      }
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
    <div className="msd-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
        <label className="input-label" style={{ marginBottom: 0, fontWeight: 700, color: '#334155', fontSize: '13px', textTransform: 'uppercase' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          <label style={{ margin: 0 }}>Visible limit:</label>
          <input type="number" min="0" value={maxVisible} onChange={handleMaxChange} onClick={(e) => e.stopPropagation()} className="msd-limit-input" />
        </div>
      </div>

      <div className="msd-box" onClick={() => setIsOpen(true)}>
        <div className="msd-chips">
          {visibleSelected.map(opt => (
            <span key={opt} className="msd-chip">
              {opt}
              <button className="msd-chip-remove" onClick={(e) => remove(e, opt)}>×</button>
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="msd-chip-more" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
              +{hiddenCount} more
            </span>
          )}
          {selected.length === 0 && <span className="msd-placeholder">Select options...</span>}
        </div>
        <div className="msd-chevron">✎ Edit</div>
      </div>

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
              <div className="msd-add-row">
                <input
                  type="text"
                  placeholder="Type custom item and press Add..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button type="button" onClick={handleAdd}>Add</button>
              </div>

              <div className="msd-options-grid">
                {selected.map(opt => (
                  <label key={opt} className="msd-option-box selected">
                    <input type="checkbox" checked={true} onChange={() => toggleOption(opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
                {options.filter(o => !selected.includes(o)).map(opt => (
                  <label key={opt} className="msd-option-box">
                    <input type="checkbox" checked={false} onChange={() => toggleOption(opt)} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button className="btn-primary" onClick={() => setIsOpen(false)} style={{ width: '100%' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- LOCAL STYLES FOR THE DROPDOWN ---
const localStyles = `
.msd-container { position: relative; width: 100%; margin-bottom: 24px; display: block; }
.msd-limit-input { width: 45px; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; text-align: center; outline: none; background-color: #f8fafc; color: #0f172a; transition: all 0.2s ease; }
.msd-limit-input:focus { border-color: #e11d48; background-color: #ffffff; }
.msd-limit-input::-webkit-inner-spin-button, .msd-limit-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.msd-box { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; min-height: 48px; transition: all 0.2s ease; }
.msd-box:hover { border-color: #94a3b8; }
.msd-chips { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }
.msd-chip { display: inline-flex; align-items: center; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; font-size: 13px; font-weight: 600; color: #334155; }
.msd-chip-remove { background: transparent; border: none; color: #94a3b8; margin-left: 6px; cursor: pointer; font-size: 14px; font-weight: bold; }
.msd-chip-remove:hover { color: #ef4444; }
.msd-chip-more { background-color: #ffe4e6; color: #e11d48; border-color: #fecdd3; cursor: pointer; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 13px; display: inline-flex; align-items: center; }
.msd-placeholder { color: #94a3b8; font-size: 14px; }
.msd-chevron { color: #e11d48; font-size: 13px; font-weight: 700; margin-left: 12px; }
.msd-add-row { display: flex; padding: 0 0 16px 0; background: transparent; }
.msd-add-row input { flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px 0 0 6px; font-size: 13px; outline: none; }
.msd-add-row input:focus { border-color: #e11d48; }
.msd-add-row button { padding: 10px 16px; background: #0f172a; color: #ffffff; border: none; border-radius: 0 6px 6px 0; font-size: 13px; font-weight: 600; cursor: pointer; }
.msd-options-grid { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; padding: 4px; }
.msd-option-box { display: flex; align-items: center; gap: 14px; padding: 12px 16px; cursor: pointer; font-size: 14px; color: #334155; font-weight: 600; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02); margin: 0; }
.msd-option-box:hover { border-color: #cbd5e1; background: #f8fafc; transform: translateY(-1px); }
.msd-option-box.selected { border-color: #e11d48; background-color: #fff1f2; color: #0f172a; box-shadow: 0 2px 4px rgba(225,29,72,0.08); }
.msd-option-box input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: #e11d48; margin: 0; }
`;

export default function NewDatasetPage({ navigate, params }) {
  const projectId = params?.projectId;
  const industry = params?.industry || "Software as a Service";

  const [activeStep, setActiveStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: `Scenario_${new Date().toISOString().slice(0, 10)}`, description: "", startYear: "2024", numYears: "2", randomSeed: "42",
    seasonality_profile: "flat", inflation_preset: "medium", marketing_intensity: "1.0", sentiment_volatility: "0.15", fx_volatility: "0.05",
  });

  const [allDimensions, setAllDimensions] = useState(["Region", "Product", "Channel"]);
  const [activeDimensions, setActiveDimensions] = useState(["Region", "Product", "Channel"]);
  
  const [scenarios, setScenarios] = useState(["Base Scenario", "High Growth", "Recession"]);
  const [selectedScenarios, setSelectedScenarios] = useState(["Base Scenario"]);

  const [availableMembers, setAvailableMembers] = useState({
    Region: ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"],
    Product: ["Basic Plan", "Pro Plan", "Enterprise", "Professional Services"],
    Channel: ["Direct Sales", "Partner Network", "Online Self-Service"],
  });
  const [selectedMembers, setSelectedMembers] = useState({ Region: ["North America", "Europe"], Product: ["Enterprise", "Pro Plan"], Channel: [] });

  const [accounts, setAccounts] = useState(["Revenue", "COGS", "Gross Profit", "Payroll", "Marketing", "SGA", "R&D", "EBITDA", "Depreciation & Amortization", "EBIT", "Net Income"]);
  const [selectedAccounts, setSelectedAccounts] = useState(["Revenue", "COGS", "Gross Profit", "Payroll", "SGA", "EBITDA", "EBIT"]);

  useEffect(() => {
    if (!projectId) return;
    api.getProject(projectId).then(project => {
      if (!project) return;
      const overrides = project.template_overrides || project.parameters || {};
      const customProducts = parseSafeArray(overrides.products);
      const customRegions = parseSafeArray(overrides.regions);

      if (customProducts.length > 0 || customRegions.length > 0) {
        setAvailableMembers(prev => ({
          ...prev,
          Product: Array.from(new Set([...prev.Product, ...customProducts])),
          Region: Array.from(new Set([...prev.Region, ...customRegions]))
        }));
        setSelectedMembers(prev => ({
          ...prev,
          Product: Array.from(new Set([...(prev.Product || []), ...customProducts])),
          Region: Array.from(new Set([...(prev.Region || []), ...customRegions]))
        }));
      }

      setFormData(prev => ({
        ...prev,
        seasonality_profile: Array.isArray(overrides.seasonality) ? overrides.seasonality[0] : (overrides.seasonality || prev.seasonality_profile),
        inflation_preset: Array.isArray(overrides.inflation) ? overrides.inflation[0] : (overrides.inflation || prev.inflation_preset)
      }));
    }).catch(console.error);
  }, [projectId]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddDimension = (val) => {
    const dim = val.trim();
    if (!dim) return;
    const formattedDim = dim.charAt(0).toUpperCase() + dim.slice(1);

    if (!allDimensions.includes(formattedDim)) setAllDimensions(prev => [...prev, formattedDim]);
    if (!activeDimensions.includes(formattedDim)) setActiveDimensions(prev => [...prev, formattedDim]);
    if (!availableMembers[formattedDim]) {
      setAvailableMembers(prev => ({ ...prev, [formattedDim]: [] }));
      setSelectedMembers(prev => ({ ...prev, [formattedDim]: [] }));
    }
  };

  const handleAddScenario = (val) => {
    const scen = val.trim();
    if (!scen) return;
    if (!scenarios.includes(scen)) setScenarios(prev => [...prev, scen]);
    if (!selectedScenarios.includes(scen)) setSelectedScenarios(prev => [...prev, scen]);
  };

  const handleGenerate = async () => {
    if (!formData.name.trim()) return alert("Please enter a dataset name.");
    for (const dim of activeDimensions) {
      if (!selectedMembers[dim] || selectedMembers[dim].length === 0) {
        return alert(`Error: You have '${dim}' enabled as an Active Dimension, but you haven't selected any members for it. Please select at least one!`);
      }
    }
    if (selectedAccounts.length === 0) return alert("Error: You must select at least one Account item.");

    setIsGenerating(true);

    const lowercasedCustomDims = {};
    Object.keys(selectedMembers).forEach(k => { lowercasedCustomDims[k.toLowerCase()] = selectedMembers[k]; });

    const payload = {
      name: formData.name, description: formData.description,
      start_year: parseInt(formData.startYear) || 2024, num_years: Math.max(1, parseInt(formData.numYears) || 1), random_seed: parseInt(formData.randomSeed) || 42,
      dimensions: activeDimensions.map(d => d.toLowerCase()),
      scenarios: selectedScenarios.length > 0 ? selectedScenarios : ["Base Scenario"], accounts: selectedAccounts,
      seasonality_profile: formData.seasonality_profile, inflation_preset: formData.inflation_preset,
      marketing_intensity: parseFloat(formData.marketing_intensity) || 1.0, sentiment_volatility: parseFloat(formData.sentiment_volatility) || 0.15, fx_volatility: parseFloat(formData.fx_volatility) || 0.05,
      custom_dimensions: lowercasedCustomDims, products: selectedMembers["Product"] || [], regions: selectedMembers["Region"] || [], channels: selectedMembers["Channel"] || []
    };

    try {
      await api.createDataset(projectId, payload);
      navigate("project-detail", { projectId });
    } catch (error) {
      alert("Failed to generate dataset: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { id: 1, title: "Core Information", desc: "Basic dataset parameters and dimensions" },
    { id: 2, title: "Dimensional Architecture", desc: "Configure dimension members" },
    { id: 3, title: "Chart of Accounts", desc: "Financial line items" },
    { id: 4, title: "Macroeconomic Parameters", desc: "Inflation and FX" },
  ];

  const renderSummaryRow = (label, value, isLast = false) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", paddingBottom: "10px", borderBottom: isLast ? "none" : "1px dashed #cbd5e1", marginBottom: isLast ? "0" : "10px" }}>
      <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>{label}</span>
      <strong style={{ color: "#0f172a" }}>{value}</strong>
    </div>
  );

  return (
    <div className="new-ds-wrapper">
      <style>{localStyles}</style>
      
      <div className="new-ds-header">
        <button onClick={() => navigate("project-detail", { projectId })} className="back-btn">Back to Project</button>
        <div className="header-titles">
          <h1>Configure Dataset</h1>
          <p>Progressive generation profile for {industry}.</p>
        </div>
      </div>

      <div className="new-ds-split-layout">
        <div className="steps-sidebar">
          {steps.map(step => (
            <div key={step.id}
              className={`step-nav-item ${activeStep === step.id ? "active" : ""} ${activeStep > step.id ? "completed" : ""}`}
              onClick={() => setActiveStep(step.id)}>
              <div className="step-number">{step.id}</div>
              <div className="step-text">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="form-content-area">
          {activeStep === 1 && (
            <div className="form-panel">
              <h2 className="panel-title">Step 1 — Core Information</h2>

              <div className="form-grid-2-col">
                <div className="form-group">
                  <label>Dataset Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Start Year</label>
                  <select name="startYear" value={formData.startYear} onChange={handleInputChange}>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Years</label>
                  <select name="numYears" value={formData.numYears} onChange={handleInputChange}>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Random Seed</label>
                  <input type="number" name="randomSeed" value={formData.randomSeed} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
                <MultiSelectDropdown
                  label="Active Dimensions"
                  options={allDimensions}
                  selected={activeDimensions}
                  onChange={setActiveDimensions}
                  onAddCustom={handleAddDimension}
                />

                <div style={{ marginTop: "24px" }}>
                  <MultiSelectDropdown
                    label="Active Scenarios"
                    options={scenarios}
                    selected={selectedScenarios}
                    onChange={setSelectedScenarios}
                    onAddCustom={handleAddScenario}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={() => setActiveStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="form-panel">
              <h2 className="panel-title">Step 2 — Dimensional Architecture</h2>

              <div className="dimensions-container">
                {activeDimensions.map(dimName => {
                  const members = availableMembers[dimName] || [];
                  const selected = selectedMembers[dimName] || [];
                  
                  // Helper to match the specific naming convention from your screenshot
                  const getLabelForDim = (dim) => {
                    if (dim.toLowerCase() === 'product') return 'ACTIVE PRODUCTS';
                    if (dim.toLowerCase() === 'region') return 'ACTIVE REGIONS';
                    if (dim.toLowerCase() === 'channel') return 'SALES CHANNELS';
                    return `ACTIVE ${dim.toUpperCase()}S`;
                  };

                  return (
                    <MultiSelectDropdown
                      key={dimName}
                      label={getLabelForDim(dimName)}
                      options={members}
                      selected={selected}
                      onChange={(newSelected) => setSelectedMembers(prev => ({ ...prev, [dimName]: newSelected }))}
                      onAddCustom={(newVal) => {
                        // Add to available pool if new
                        if (!availableMembers[dimName]?.includes(newVal)) {
                          setAvailableMembers(prev => ({ ...prev, [dimName]: [...(prev[dimName] || []), newVal] }));
                        }
                        // Automatically select it
                        setSelectedMembers(prev => {
                          const curr = prev[dimName] || [];
                          return curr.includes(newVal) ? prev : { ...prev, [dimName]: [...curr, newVal] };
                        });
                      }}
                    />
                  );
                })}
                
                {activeDimensions.length === 0 && (
                  <div className="empty-state">
                    <strong>No active dimensions.</strong>
                    <span>Go back to Step 1 to enable dimensions.</span>
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(1)}>Back</button>
                <button className="btn-primary" onClick={() => setActiveStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="form-panel">
              <h2 className="panel-title">Step 3 — Chart of Accounts</h2>

              <div className="dimensions-container">
                <MultiSelectDropdown
                  label="FINANCIAL LINE ITEMS"
                  options={accounts}
                  selected={selectedAccounts}
                  onChange={setSelectedAccounts}
                  onAddCustom={(newVal) => {
                    if (!accounts.includes(newVal)) setAccounts(prev => [...prev, newVal]);
                    if (!selectedAccounts.includes(newVal)) setSelectedAccounts(prev => [...prev, newVal]);
                  }}
                />
              </div>

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(2)}>Back</button>
                <button className="btn-primary" onClick={() => setActiveStep(4)}>Continue</button>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="form-panel">
              <h2 className="panel-title">Step 4 — Macroeconomic Parameters</h2>

              <div className="form-grid-2-col">
                <div className="form-group">
                  <label>Seasonality Profile</label>
                  <select name="seasonality_profile" value={formData.seasonality_profile} onChange={handleInputChange}>
                    <option value="flat">Flat</option>
                    <option value="summer_peak">Summer Peak</option>
                    <option value="winter_peak">Winter Peak</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Inflation Preset</label>
                  <select name="inflation_preset" value={formData.inflation_preset} onChange={handleInputChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marketing Intensity</label>
                  <input type="number" step="0.1" name="marketing_intensity" value={formData.marketing_intensity} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>FX Volatility</label>
                  <input type="number" step="0.01" name="fx_volatility" value={formData.fx_volatility} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Sentiment Volatility</label>
                  <input type="number" step="0.01" name="sentiment_volatility" value={formData.sentiment_volatility} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ marginTop: "24px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Generation Summary
                </h4>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {renderSummaryRow("Name:", formData.name)}
                  {renderSummaryRow("Years:", `${formData.startYear} – ${parseInt(formData.startYear) + parseInt(formData.numYears) - 1}`)}
                  {renderSummaryRow("Scenarios:", selectedScenarios.join(', ') || 'None')}
                  {renderSummaryRow("Accounts:", selectedAccounts.length)}
                  
                  {activeDimensions.length === 0 && renderSummaryRow("Dimensions:", "None", true)}
                  {activeDimensions.map((dim, idx) => (
                    <React.Fragment key={dim}>
                      {renderSummaryRow(`${dim}s:`, (selectedMembers[dim] || []).length, idx === activeDimensions.length - 1)}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(3)} disabled={isGenerating}>Back</button>
                <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Dataset"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}