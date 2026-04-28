import { useState, useEffect } from "react";
import { api } from "../hooks/api";
import { Card, Btn, Input, SectionHeader, Toast, Spinner } from "../components/UI";
import "./NewProjectPage.css";

const INDUSTRY_META = {
  cpg: { icon: "🏭", color: "#10b981", desc: "FMCG manufacturer with retail distribution" },
  saas: { icon: "☁️", color: "#3b82f6", desc: "Subscription software with recurring revenue" },
  retail: { icon: "🛍️", color: "#f59e0b", desc: "Omnichannel retailer with physical + digital" },
};

// --- ARRAY EDITOR (For Products & Regions) ---
function EditableTags({ label, tags, onChange }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput("");
    }
  };

  const remove = (t) => {
    onChange(tags.filter(x => x !== t));
  };

  return (
    <div className="tags-group">
      <span className="tags-label">{label}</span>
      <div className="tags-box">
        {tags.map(t => (
          <div key={t} className="tag-item">
            {t}
            <button onClick={() => remove(t)} className="tag-remove-btn">
              ×
            </button>
          </div>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Type and press Enter..." : "Add more..."}
          className="tags-input"
        />
      </div>
    </div>
  );
}

// --- STRICT DROPDOWN (For Seasonality & Inflation) ---
function SimpleDropdown({ label, value, options = [], onChange }) {
  return (
    <div className="tags-group">
      <span className="tags-label">{label}</span>
      <select 
        className="config-select" 
        value={value} 
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function NewProjectPage({ navigate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "", description: "" });
  
  const [templateOptions, setTemplateOptions] = useState({ products: [], regions: [], seasonality: [], inflation: [] });
  const [overrides, setOverrides] = useState({ products: [], regions: [], seasonality: "flat", inflation: "medium" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.getTemplates()
      .then(t => { 
        setTemplates(t); 
      })
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectIndustry = async (indKey) => {
    setForm(f => ({ ...f, industry: indKey }));
    try {
      const templateData = await api.getTemplate(indKey);
      
      const safeSeasonality = templateData.seasonality_profiles ? Object.keys(templateData.seasonality_profiles) : ["flat"];
      const safeInflation = templateData.inflation_presets || templateData.inflation_curve_presets ? Object.keys(templateData.inflation_presets || templateData.inflation_curve_presets) : ["medium"];

      setTemplateOptions({
        products: templateData.available_dimensions?.product || [],
        regions: templateData.available_dimensions?.region || [],
        seasonality: safeSeasonality,
        inflation: safeInflation,
      });

      setOverrides({
        products: templateData.available_dimensions?.product || [],
        regions: templateData.available_dimensions?.region || [],
        seasonality: safeSeasonality[0],
        inflation: safeInflation[0]
      });
    } catch (e) {
      console.error("Could not load template details:", e);
    }
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async () => {
    if (!form.name.trim()) return showToast("Project name required", "error");
    if (!form.industry) return showToast("Select an industry", "error");
    setSaving(true);
    try {
      const payload = { ...form, template_overrides: overrides };
      const proj = await api.createProject(payload);
      navigate("project-detail", { projectId: proj.id });
    } catch (err) {
      showToast(err.message, "error");
      setSaving(false);
    }
  };

  return (
    <div className="np-container">
      <button onClick={() => navigate("projects")} className="back-btn">
        ← Back to Projects
      </button>

      <SectionHeader title="Create New Project" subtitle="Choose an industry template and customize the default parameters." />

      {loading ? (
        <div className="loading-container"><Spinner /></div>
      ) : (
        <div className="form-stack">
          
          <div className="np-split-layout">
            
            {/* LEFT COLUMN: CORE INFO & TEMPLATES */}
            <div className="np-left-col">
              <Card style={{ padding: 24 }}>
                <div className="section-label">1. Core Information</div>
                <div className="card-stack">
                  <Input
                    label="Project Name"
                    value={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                    placeholder="e.g. Q1 2025 Planning Scenarios"
                  />
                  <Input
                    label="Description (optional)"
                    value={form.description}
                    onChange={v => setForm(f => ({ ...f, description: v }))}
                    placeholder="Brief description of this project's purpose"
                  />
                </div>
              </Card>

              <Card style={{ padding: 24 }}>
                <div className="section-label">2. Industry Template</div>
                <div className="industry-grid">
                  {templates.map(t => {
                  const meta = INDUSTRY_META[t.industry] || { icon: "📈", color: "#3b82f6", desc: t.description };
                  const active = form.industry === t.industry;
                  return (
                    <button key={t.industry} onClick={() => handleSelectIndustry(t.industry)} className={`industry-card ${active ? 'active' : ''}`}>
                      <div className="industry-icon">{meta.icon}</div>
                      
                      {/* Wrap the text so it stacks vertically! */}
                      <div className="industry-card-content">
                        <div className="industry-title">{t.label}</div>
                        <div className="industry-desc">{meta.desc}</div>
                      </div>
                      
                    </button>
                  );
                })}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: CUSTOMIZE DETAILS */}
            <div className="np-right-col">
              {form.industry ? (
                <Card style={{ padding: 24, height: '100%' }}>
                  <div className="overrides-title">3. Customize Template Details</div>
                  
                  <div className="overrides-grid">
                    <EditableTags 
                      label="Available Products" 
                      tags={overrides.products} 
                      onChange={(newTags) => setOverrides(o => ({ ...o, products: newTags }))} 
                    />
                    <EditableTags 
                      label="Geographic Regions" 
                      tags={overrides.regions} 
                      onChange={(newTags) => setOverrides(o => ({ ...o, regions: newTags }))} 
                    />
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
                </Card>
              ) : (
                <div className="empty-config" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', border: '2px dashed #cbd5e1', borderRadius: '16px', color: '#64748b'}}>
                  <div style={{fontSize: '48px', marginBottom: '16px'}}>⚙️</div>
                  <h3>Select an Industry</h3>
                  <p>Choose an industry blueprint on the left to configure.</p>
                </div>
              )}
            </div>

          </div>

          <div className="form-actions">
            <Btn variant="secondary" onClick={() => navigate("projects")}>Cancel</Btn>
            <Btn size="lg" onClick={submit} disabled={saving || !form.industry}>
              {saving ? "Creating..." : "Create Project →"}
            </Btn>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}