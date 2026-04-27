import React, { useState } from "react";
import "./NewDatasetPage.css";
import { api } from "../hooks/api";

// FIX: NewDatasetPage receives { navigate, params } — not projectId directly.
// The navigate call is: navigate("new-dataset", { projectId })
// So params.projectId is the correct source.
export default function NewDatasetPage({ navigate, params }) {
  const projectId = params?.projectId;
  const industry  = params?.industry || "Software as a Service";

  const [activeStep, setActiveStep]     = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Form state ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", description: "", startYear: "2023", numYears: "2", randomSeed: "42",
    seasonality_profile: "flat", inflation_preset: "medium",
    marketing_intensity: "1.0", sentiment_volatility: "0.15", fx_volatility: "0.05",
  });

  // ── Step 1: master selections ─────────────────────────────
  const [allDimensions, setAllDimensions]       = useState(["Region", "Product", "Channel"]);
  const [activeDimensions, setActiveDimensions] = useState(["Region", "Product", "Channel"]);
  const [newDimName, setNewDimName]             = useState("");

  const [scenarios, setScenarios]               = useState(["Base Scenario", "High Growth", "Recession"]);
  const [selectedScenarios, setSelectedScenarios] = useState(["Base Scenario"]);
  const [newScenarioName, setNewScenarioName]   = useState("");

  // ── Step 2: dimension members ─────────────────────────────
  const [availableMembers, setAvailableMembers] = useState({
    Region:  ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"],
    Product: ["Basic Plan", "Pro Plan", "Enterprise", "Professional Services"],
    Channel: ["Direct Sales", "Partner Network", "Online Self-Service"],
  });
  const [selectedMembers, setSelectedMembers] = useState({
    Region:  ["North America", "Europe"],
    Product: ["Enterprise", "Pro Plan"],
    Channel: [],
  });
  const [newMemberInputs, setNewMemberInputs] = useState({});

  // ── Step 3: chart of accounts ─────────────────────────────
  const [accounts, setAccounts] = useState([
    "Revenue", "COGS", "Gross Profit", "Payroll", "Marketing",
    "SGA", "R&D", "EBITDA", "Depreciation & Amortization", "EBIT", "Net Income",
  ]);
  const [selectedAccounts, setSelectedAccounts] = useState([
    "Revenue", "COGS", "Gross Profit", "Payroll", "SGA", "EBITDA", "EBIT",
  ]);
  const [newAccountName, setNewAccountName] = useState("");

  // ── Handlers ──────────────────────────────────────────────
  const handleInputChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleArrayItem = (setter, item) =>
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const toggleMember = (dim, member) =>
    setSelectedMembers(prev => {
      const current = prev[dim] || [];
      return { ...prev, [dim]: current.includes(member) ? current.filter(m => m !== member) : [...current, member] };
    });

  const handleAddMember = (dim) => {
    const val = newMemberInputs[dim]?.trim();
    if (val && !(availableMembers[dim] || []).includes(val)) {
      setAvailableMembers(prev => ({ ...prev, [dim]: [...(prev[dim] || []), val] }));
      toggleMember(dim, val);
      setNewMemberInputs(prev => ({ ...prev, [dim]: "" }));
    }
  };

  // ── Submit ────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!formData.name.trim()) return alert("Please enter a dataset name.");
    if (!projectId)            return alert("Missing project ID — go back and retry.");

    setIsGenerating(true);
    const payload = {
      name:                  formData.name,
      description:           formData.description,
      start_year:            parseInt(formData.startYear),
      num_years:             parseInt(formData.numYears),
      random_seed:           parseInt(formData.randomSeed),
      dimensions:            activeDimensions,
      scenarios:             selectedScenarios,
      accounts:              selectedAccounts,
      seasonality_profile:   formData.seasonality_profile,
      inflation_preset:      formData.inflation_preset,
      marketing_intensity:   parseFloat(formData.marketing_intensity),
      sentiment_volatility:  parseFloat(formData.sentiment_volatility),
      fx_volatility:         parseFloat(formData.fx_volatility),
      custom_dimensions:     selectedMembers,
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
    { id: 1, title: "Core Information",        desc: "Basic dataset parameters & dimensions" },
    { id: 2, title: "Dimensional Architecture",desc: "Configure dimension members" },
    { id: 3, title: "Chart of Accounts",       desc: "Financial line items" },
    { id: 4, title: "Macroeconomic Parameters",desc: "Inflation and FX" },
  ];

  return (
    <div className="new-ds-wrapper">
      <div className="new-ds-header">
        <button onClick={() => navigate("project-detail", { projectId })} className="back-btn">
          ← Back to Project
        </button>
        <div className="header-titles">
          <h1>Configure Dataset</h1>
          <p>Progressive generation profile for {industry}.</p>
        </div>
      </div>

      <div className="new-ds-split-layout">
        {/* SIDEBAR */}
        <div className="steps-sidebar">
          {steps.map(step => (
            <div
              key={step.id}
              className={`step-nav-item ${activeStep === step.id ? "active" : ""} ${activeStep > step.id ? "completed" : ""}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="step-number">{activeStep > step.id ? "✓" : step.id}</div>
              <div className="step-text"><h3>{step.title}</h3><p>{step.desc}</p></div>
            </div>
          ))}
        </div>

        {/* FORM AREA */}
        <div className="form-content-area">

          {/* ── STEP 1: CORE INFO ── */}
          {activeStep === 1 && (
            <div className="form-panel">
              <h2 className="panel-title">1. Core Information</h2>
              <div className="panel-divider" />

              <div className="form-grid-2-col">
                <div className="form-group">
                  <label>Dataset Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Q1 2024 Forecast" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Optional description" />
                </div>
                <div className="form-group">
                  <label>Start Year</label>
                  <select name="startYear" value={formData.startYear} onChange={handleInputChange}>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Years</label>
                  <select name="numYears" value={formData.numYears} onChange={handleInputChange}>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="4">4 Years</option>
                    <option value="5">5 Years</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Random Seed</label>
                  <input type="number" name="randomSeed" value={formData.randomSeed} onChange={handleInputChange} />
                </div>
              </div>

              {/* Active Dimensions */}
              <h4 className="section-subtitle">Active Dimensions</h4>
              <p className="section-desc">Select which dimensions will be generated in this dataset.</p>
              <div className="member-chip-grid">
                {allDimensions.map(dim => {
                  const isSelected = activeDimensions.includes(dim);
                  return (
                    <button key={dim} className={`member-chip ${isSelected ? "selected" : ""}`} onClick={() => toggleArrayItem(setActiveDimensions, dim)}>
                      {isSelected && <span className="chip-check">✓</span>} {dim}
                    </button>
                  );
                })}
                <div className="add-member-input-group">
                  <input
                    type="text" placeholder="+ Custom Dim…"
                    value={newDimName} onChange={e => setNewDimName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newDimName.trim()) {
                        const val = newDimName.trim();
                        if (!allDimensions.includes(val)) setAllDimensions(prev => [...prev, val]);
                        if (!activeDimensions.includes(val)) setActiveDimensions(prev => [...prev, val]);
                        setNewDimName("");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Active Scenarios */}
              <h4 className="section-subtitle" style={{ marginTop: 24 }}>Active Scenarios</h4>
              <div className="member-chip-grid">
                {scenarios.map(scen => (
                  <button key={scen} className={`member-chip ${selectedScenarios.includes(scen) ? "selected" : ""}`} onClick={() => toggleArrayItem(setSelectedScenarios, scen)}>
                    {selectedScenarios.includes(scen) && <span className="chip-check">✓</span>} {scen}
                  </button>
                ))}
                <div className="add-member-input-group">
                  <input
                    type="text" placeholder="+ New Scenario…"
                    value={newScenarioName} onChange={e => setNewScenarioName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newScenarioName.trim()) {
                        setScenarios(prev => [...prev, newScenarioName.trim()]);
                        setSelectedScenarios(prev => [...prev, newScenarioName.trim()]);
                        setNewScenarioName("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-red" onClick={() => setActiveStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: DIMENSIONAL ARCHITECTURE ── */}
          {activeStep === 2 && (
            <div className="form-panel">
              <h2 className="panel-title">2. Dimensional Architecture</h2>
              <div className="panel-divider" />

              <div className="dimensions-container">
                {activeDimensions.map(dimName => {
                  const members       = availableMembers[dimName] || [];
                  const selectedCount = selectedMembers[dimName]?.length || 0;
                  return (
                    <div key={dimName} className="dimension-group">
                      <div className="dimension-header">
                        <h4 className="dimension-title">{dimName}</h4>
                        <span className={`dimension-count ${selectedCount > 0 ? "active-count" : ""}`}>{selectedCount} selected</span>
                      </div>
                      <div className="member-chip-grid">
                        {members.map(member => {
                          const isSelected = (selectedMembers[dimName] || []).includes(member);
                          return (
                            <button key={member} className={`member-chip ${isSelected ? "selected" : ""}`} onClick={() => toggleMember(dimName, member)}>
                              {isSelected && <span className="chip-check">✓</span>} {member}
                            </button>
                          );
                        })}
                        <div className="add-member-input-group">
                          <input
                            type="text" placeholder={`+ Add ${dimName}…`}
                            value={newMemberInputs[dimName] || ""}
                            onChange={e => setNewMemberInputs(prev => ({ ...prev, [dimName]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && handleAddMember(dimName)}
                          />
                          <button className="btn-small-add" onClick={() => handleAddMember(dimName)}>Add</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(1)}>← Back</button>
                <button className="btn-red"     onClick={() => setActiveStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CHART OF ACCOUNTS ── */}
          {activeStep === 3 && (
            <div className="form-panel">
              <h2 className="panel-title">3. Chart of Accounts</h2>
              <div className="panel-divider" />
              <p className="section-desc">Select the financial line items to simulate.</p>

              <div className="dimension-group" style={{ background: "white" }}>
                <div className="member-chip-grid">
                  {accounts.map(acc => (
                    <button key={acc} className={`member-chip ${selectedAccounts.includes(acc) ? "selected" : ""}`} onClick={() => toggleArrayItem(setSelectedAccounts, acc)}>
                      {selectedAccounts.includes(acc) && <span className="chip-check">✓</span>} {acc}
                    </button>
                  ))}
                  <div className="add-member-input-group">
                    <input
                      type="text" placeholder="+ New Account…"
                      value={newAccountName} onChange={e => setNewAccountName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && newAccountName.trim()) {
                          setAccounts(prev => [...prev, newAccountName.trim()]);
                          setSelectedAccounts(prev => [...prev, newAccountName.trim()]);
                          setNewAccountName("");
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(2)}>← Back</button>
                <button className="btn-red"     onClick={() => setActiveStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: MACRO PARAMETERS ── */}
          {activeStep === 4 && (
            <div className="form-panel">
              <h2 className="panel-title">4. Macroeconomic Parameters</h2>
              <div className="panel-divider" />

              <div className="form-grid-2-col">
                <div className="form-group">
                  <label>Seasonality Profile</label>
                  <select name="seasonality_profile" value={formData.seasonality_profile} onChange={handleInputChange}>
                    <option value="flat">Flat (No Seasonality)</option>
                    <option value="summer_peak">Summer Peak</option>
                    <option value="holiday_peak">Holiday Peak (Q4)</option>
                    <option value="back_to_school">Back to School (Q3)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Inflation Preset</label>
                  <select name="inflation_preset" value={formData.inflation_preset} onChange={handleInputChange}>
                    <option value="low">Low (1–2%)</option>
                    <option value="medium">Medium (3–5%)</option>
                    <option value="high">High (6–9%)</option>
                    <option value="hyperinflation">Hyperinflation (10%+)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marketing Intensity (Multiplier)</label>
                  <input type="number" step="0.1" min="0.1" max="3" name="marketing_intensity" value={formData.marketing_intensity} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>FX Volatility (%)</label>
                  <input type="number" step="0.01" min="0" max="0.5" name="fx_volatility" value={formData.fx_volatility} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Consumer Sentiment Volatility</label>
                  <input type="number" step="0.01" min="0" max="1" name="sentiment_volatility" value={formData.sentiment_volatility} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-outline" onClick={() => setActiveStep(3)} disabled={isGenerating}>← Back</button>
                <button className="btn-red" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating…" : "Generate Dataset"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
