import React, { useState, useEffect } from "react";
import { api } from "../hooks/api";
import "./ProjectDetailPage.css";

const API_BASE = "http://localhost:8000/api";

export default function ProjectDetailPage({ navigate, params }) {
  const { projectId } = params || {};
  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDataset, setExpandedDataset] = useState(null);

  // --- NEW: COMMAND BAR STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [sortParam, setSortParam] = useState("newest");

  const [paramsModal, setParamsModal] = useState({ isOpen: false, params: {} });
  const [advModal, setAdvModal] = useState({ isOpen: false, datasetId: null, fileName: null, schema: [], selectedColumns: [], filters: {} });
  const [inlineBuilder, setInlineBuilder] = useState({ isOpen: false, datasetId: null, targetFile: "", customFileName: "", schema: [], selectedColumns: [], filters: {}, isLoading: false, error: null });

  const fetchDatasets = () => {
    fetch(`${API_BASE}/projects/${projectId}/datasets`)
      .then(res => res.json())
      .then(setDatasets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!projectId) return;
    api.getProject(projectId).then(setProject).catch(console.error);
    fetchDatasets();
  }, [projectId]);

  const toggleDataset = (id) => setExpandedDataset(expandedDataset === id ? null : id);

  const handleDeleteDataset = async (e, datasetId) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to permanently delete this dataset and all its files?")) return;
    
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/datasets/${datasetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete dataset");
      
      setDatasets(datasets.filter(d => d.id !== datasetId));
      if (expandedDataset === datasetId) setExpandedDataset(null);
    } catch (err) {
      alert("Error deleting dataset: " + err.message);
    }
  };

  const getFileMeta = (filename) => {
    if (filename.includes('fact')) return { icon: '📊', desc: 'Full dataset fact table' };
    if (filename.includes('dim_time')) return { icon: '📅', desc: 'Time definitions' };
    if (filename.includes('pnl')) return { icon: '💰', desc: 'Consolidated P&L' };
    return { icon: '⭐', desc: 'Custom saved slice' }; 
  };

  const handleDownloadSingle = (datasetId, fileName) => {
    window.location.href = `${API_BASE}/projects/${projectId}/datasets/${datasetId}/download?file=${fileName}`;
  };

  // --- EXCEL BUILDER (MODAL) LOGIC ---
  const loadInlineSchema = (datasetId, fileName, forceOpen = false) => {
    setInlineBuilder(prev => ({
      ...prev, isOpen: forceOpen ? true : prev.isOpen, datasetId: datasetId, targetFile: fileName, customFileName: "",
      schema: [], selectedColumns: [], filters: {}, isLoading: !!fileName, error: fileName ? null : "No valid CSV files found in this dataset."
    }));

    if (!fileName) return;

    fetch(`${API_BASE}/projects/${projectId}/datasets/${datasetId}/files/${fileName}/advanced-schema`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "File missing. Try generating a new dataset.");
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.schema)) {
          setInlineBuilder(prev => ({ ...prev, schema: data.schema, selectedColumns: data.schema.map(s => String(s.column)), isLoading: false }));
        }
      })
      .catch(err => { setInlineBuilder(prev => ({ ...prev, isLoading: false, error: err.message })); });
  };

  const openExcelBuilderModal = (datasetId, filesList) => {
    const safeFiles = filesList || [];
    const defaultFile = safeFiles.find(f => f.includes('fact_sales')) || safeFiles.filter(f => f.endsWith('.csv'))[0] || "";
    loadInlineSchema(datasetId, defaultFile, true);
  };

  const toggleInlineColumn = (col) => {
    setInlineBuilder(p => {
      const isSelected = p.selectedColumns.includes(col);
      const newCols = isSelected ? p.selectedColumns.filter(c => c !== col) : [...p.selectedColumns, col];
      let newFilters = { ...p.filters };
      if (!isSelected) {
        const members = p.schema.find(s => s.column === col)?.members || [];
        if (members.length > 0 && !newFilters[col]) newFilters[col] = members;
      } else { delete newFilters[col]; }
      return { ...p, selectedColumns: newCols, filters: newFilters };
    });
  };

  const addInlineFilter = (colName) => { if (!colName) return; const allMembers = inlineBuilder.schema.find(s => s.column === colName)?.members || []; setInlineBuilder(p => ({ ...p, filters: { ...p.filters, [colName]: allMembers } })); };
  const removeInlineFilter = (colName) => setInlineBuilder(p => { const newFilters = { ...p.filters }; delete newFilters[colName]; return { ...p, filters: newFilters }; });
  const toggleInlineMember = (colName, member) => setInlineBuilder(p => { const current = p.filters[colName] || []; const updated = current.includes(member) ? current.filter(m => m !== member) : [...current, member]; return { ...p, filters: { ...p.filters, [colName]: updated } }; });
  const setAllInlineMembers = (colName, members) => setInlineBuilder(p => ({...p, filters: {...p.filters, [colName]: members}}));
  const clearAllInlineMembers = (colName) => setInlineBuilder(p => ({...p, filters: {...p.filters, [colName]: []}}));
  
  const saveInlineExcelSlice = async () => {
    if (!inlineBuilder.targetFile) return alert("Please select a target file to slice first.");
    if (inlineBuilder.selectedColumns.length === 0) return alert("Select at least one column to export.");
    if (!inlineBuilder.customFileName.trim()) return alert("Please enter a name for your custom file.");
    
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/datasets/${inlineBuilder.datasetId}/files/${inlineBuilder.targetFile}/advanced-save`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_columns: inlineBuilder.selectedColumns, filters: inlineBuilder.filters, custom_file_name: inlineBuilder.customFileName })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || "Failed to save Excel."); }
      
      fetchDatasets();
      setInlineBuilder(p => ({...p, isOpen: false, customFileName: ""}));
      alert("Custom file saved!");
    } catch (err) { alert(`Save Error: ${err.message}`); }
  };

  const executeInlineExcelDownload = async () => {
    if (!inlineBuilder.targetFile) return alert("Please select a target file to slice first.");
    if (inlineBuilder.selectedColumns.length === 0) return alert("Select at least one column to export.");
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/datasets/${inlineBuilder.datasetId}/files/${inlineBuilder.targetFile}/advanced-download`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_columns: inlineBuilder.selectedColumns, filters: inlineBuilder.filters })
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || "Failed to generate Excel."); }
      const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `custom_slice_${inlineBuilder.targetFile}`; 
      document.body.appendChild(a); a.click(); a.remove();
      setInlineBuilder(p => ({...p, isOpen: false}));
    } catch (err) { alert(`Generation Error: ${err.message}`); }
  };

  // --- QUICK FILE MODAL LOGIC ---
  const openAdvancedFilter = async (datasetId, fileName) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/datasets/${datasetId}/files/${fileName}/advanced-schema`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Could not read file structure.");
      }
      const data = await res.json();
      if (data && Array.isArray(data.schema)) {
        setAdvModal({ isOpen: true, datasetId, fileName, schema: data.schema, selectedColumns: data.schema.map(s => String(s.column)), filters: {} });
      }
    } catch (err) { alert(err.message); }
  };

  const toggleModalColumn = (col) => {
    setAdvModal(p => {
      const isSelected = p.selectedColumns.includes(col);
      const newCols = isSelected ? p.selectedColumns.filter(c => c !== col) : [...p.selectedColumns, col];
      let newFilters = { ...p.filters };
      if (!isSelected) {
        const members = p.schema.find(s => s.column === col)?.members || [];
        if (members.length > 0 && !newFilters[col]) newFilters[col] = members;
      } else { delete newFilters[col]; }
      return { ...p, selectedColumns: newCols, filters: newFilters };
    });
  };

  const addModalFilter = (colName) => { if (!colName) return; const allMembers = advModal.schema.find(s => s.column === colName)?.members || []; setAdvModal(p => ({ ...p, filters: { ...p.filters, [colName]: allMembers } })); };
  const removeModalFilter = (colName) => setAdvModal(p => { const newFilters = { ...p.filters }; delete newFilters[colName]; return { ...p, filters: newFilters }; });
  const toggleModalMember = (colName, member) => setAdvModal(p => { const current = p.filters[colName] || []; const updated = current.includes(member) ? current.filter(m => m !== member) : [...current, member]; return { ...p, filters: { ...p.filters, [colName]: updated } }; });
  const setAllModalMembers = (colName, members) => setAdvModal(p => ({...p, filters: {...p.filters, [colName]: members}}));
  const clearAllModalMembers = (colName) => setAdvModal(p => ({...p, filters: {...p.filters, [colName]: []}}));
  
  const executeAdvancedModalDownload = async () => {
    if (advModal.selectedColumns.length === 0) return alert("Select at least one column.");
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/datasets/${advModal.datasetId}/files/${advModal.fileName}/advanced-download`, { 
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ selected_columns: advModal.selectedColumns, filters: advModal.filters }) 
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || "Failed to slice data."); }
      const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `custom_${advModal.fileName}`;
      document.body.appendChild(a); a.click(); a.remove(); setAdvModal({ ...advModal, isOpen: false });
    } catch (err) { alert(`Slice Error: ${err.message}`); }
  };

  // --- FILTER & SORT LOGIC FOR COMMAND BAR ---
// --- FILTER & SORT LOGIC FOR COMMAND BAR ---
  const processedDatasets = datasets
    .filter(ds => ds.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Sort by Created At
      if (sortParam === "created-desc") return new Date(b.created_at) - new Date(a.created_at);
      if (sortParam === "created-asc") return new Date(a.created_at) - new Date(b.created_at);
      
      // Sort by Rows Generated
      if (sortParam === "rows-desc") return b.total_row_count - a.total_row_count;
      if (sortParam === "rows-asc") return a.total_row_count - b.total_row_count;
      
      // Sort by Name
      if (sortParam === "name-asc") return a.name.localeCompare(b.name);
      if (sortParam === "name-desc") return b.name.localeCompare(a.name);
      
      return 0;
    });

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="pd-wrapper">
      <header className="pd-header">
        <button onClick={() => navigate("projects")} className="back-btn">← Back to Projects</button>
        <div className="pd-header-flex">
          <div className="pd-title-group">
            <h1>{project?.name}</h1>
            {project?.industry && <span className={`badge-${project.industry.name.toLowerCase().replace(/\s+/g, '-')}`}>{project.industry.name}</span>}
          </div>
          <button className="btn-red" onClick={(e) => { e.preventDefault(); navigate("new-dataset", { projectId: project?.id || projectId }); }}>
            + Generate Dataset
          </button>
        </div>
      </header>

      <div className="pd-content">
        
        {/* NEW COMMAND BAR ADDED HERE */}
        <div className="ds-command-bar">
          <div className="ds-command-left">
             <span style={{fontWeight: 800, color: '#475569'}}>{processedDatasets.length} Datasets</span>
          </div>
          <div className="ds-command-right">
             <span style={{fontSize: '14px', color: '#64748b', fontWeight: 700}}>Sort:</span>
             <select className="ds-sort-select" value={sortParam} onChange={e => setSortParam(e.target.value)}>
                <option value="created-desc">Created (Newest First)</option>
                <option value="created-asc">Created (Oldest First)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="rows-desc">Rows (Most First)</option>
                <option value="rows-asc">Rows (Fewest First)</option>
             </select>
             <input
               type="text"
               className="ds-search-input"
               placeholder="Search datasets..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        {datasets.length === 0 ? <div className="empty-state">No datasets generated yet.</div> : (
          <div className="dataset-list">
            
            {/* Map over the PROCESSED datasets so search/sort works instantly */}
            {processedDatasets.map(ds => {
              const isExpanded = expandedDataset === ds.id;
              const p = ds.params || {};
              return (
                <div key={ds.id} className={`dataset-card ${isExpanded ? 'expanded-card' : ''}`}>
                  <div className="dataset-header-row" onClick={() => toggleDataset(ds.id)}>
                    <div className="ds-icon-box">🗂️</div>
                    <div className="ds-info">
                      <h3>{ds.name}</h3>
                      <p className="ds-meta">{ds.total_row_count.toLocaleString()} rows • {new Date(ds.created_at).toLocaleString()}</p>
                    </div>
                    
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <span className={`status-badge ${ds.status.toLowerCase()}`}>{ds.status.toUpperCase()}</span>
                      <button 
                        onClick={(e) => handleDeleteDataset(e, ds.id)} 
                        style={{
                          background: 'transparent', border: 'none', color: '#94a3b8', 
                          fontSize: '18px', fontWeight: '800', cursor: 'pointer', padding: '4px'
                        }}
                        onMouseOver={e => e.target.style.color = '#e11d48'}
                        onMouseOut={e => e.target.style.color = '#94a3b8'}
                        title="Delete Dataset"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="dataset-expanded-content">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px'}}>
                        <h4 className="section-heading" style={{margin: 0}}>GENERATED FILES</h4>
                        
                        <div style={{display: 'flex', gap: '12px'}}>
                          <button className="btn-outline-small" onClick={() => setParamsModal({ isOpen: true, params: p })}>
                            ℹ️ View Parameters
                          </button>
                          <button className="btn-red" onClick={() => openExcelBuilderModal(ds.id, ds.files)}>
                            ⚙️ Open Excel Builder
                          </button>
                        </div>
                      </div>
                      
                      <div className="file-cards-grid">
                        {(ds.files || []).map(file => {
                          const meta = getFileMeta(file);
                          return (
                            <div key={file} className="file-card-interactive">
                              <div className="file-card-main" onClick={() => handleDownloadSingle(ds.id, file)}>
                                <div className="file-card-icon">{meta.icon}</div>
                                <div><h5>{file}</h5><p>{meta.desc}</p></div>
                              </div>
                              {file.endsWith('.csv') && !file.includes('custom') && (
                                <button className="btn-advanced-filter" onClick={() => openAdvancedFilter(ds.id, file)}>
                                  🎯 Quick Slice
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {paramsModal.isOpen && (
        <div className="modal-overlay" onClick={() => setParamsModal({isOpen: false, params: {}})}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{maxWidth: '750px', padding: 0}}>
            <div className="modal-header" style={{background: '#f8fafc', borderRadius: '16px 16px 0 0', padding: '24px 32px'}}>
              <div>
                <h3>Generation Parameters</h3>
                <p className="modal-desc">Settings and members used to mathematically generate this dataset.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setParamsModal({isOpen: false, params: {}})}>×</button>
            </div>
            
            <div className="params-table">
              <div className="params-table-row">
                <div className="params-table-label">Years</div>
                <div className="params-table-value">{paramsModal.params.start_year} - {parseInt(paramsModal.params.start_year) + parseInt(paramsModal.params.num_years) - 1}</div>
              </div>
              <div className="params-table-row">
                <div className="params-table-label">Seasonality Profile</div>
                <div className="params-table-value" style={{textTransform: 'capitalize'}}>{paramsModal.params.seasonality_profile}</div>
              </div>
              <div className="params-table-row">
                <div className="params-table-label">Inflation Preset</div>
                <div className="params-table-value" style={{textTransform: 'capitalize'}}>{paramsModal.params.inflation_preset}</div>
              </div>
              <div className="params-table-row">
                <div className="params-table-label">Marketing Intensity</div>
                <div className="params-table-value">{paramsModal.params.marketing_intensity}x Multiplier</div>
              </div>
              <div className="params-table-row">
                <div className="params-table-label">Sentiment Volatility</div>
                <div className="params-table-value">σ = {paramsModal.params.sentiment_volatility}</div>
              </div>
              <div className="params-table-row">
                <div className="params-table-label">FX Volatility</div>
                <div className="params-table-value">{Math.round(paramsModal.params.fx_volatility * 100)}%</div>
              </div>
              {paramsModal.params.dimensions && (
                <div className="params-table-row">
                  <div className="params-table-label">Active Dimensions</div>
                  <div className="params-table-value">{paramsModal.params.dimensions.join(', ')}</div>
                </div>
              )}
            </div>
            <div className="modal-actions" style={{borderRadius: '0 0 16px 16px', borderTop: 'none', background: 'white'}}>
              <button className="btn-outline-small" onClick={() => setParamsModal({isOpen: false, params: {}})}>Close</button>
            </div>
          </div>
        </div>
      )}

      {advModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAdvModal({...advModal, isOpen: false})}>
          <div className="modal-box-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Quick Data Slicer</h3>
                <p className="modal-desc">Configure exactly what columns and row members to export for <strong>{advModal.fileName}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setAdvModal({...advModal, isOpen: false})}>×</button>
            </div>
            
            <div className="advanced-modal-split">
              <div className="advanced-modal-left">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                  <h4 className="pane-title" style={{margin: 0}}>1. Columns to Export</h4>
                  <div className="slicer-quick-actions">
                    <button onClick={() => setAdvModal(p => {
                      const allCols = p.schema.map(s => String(s.column));
                      const allFilters = {};
                      p.schema.forEach(s => { if (s.members && s.members.length > 0) allFilters[s.column] = s.members; });
                      return { ...p, selectedColumns: allCols, filters: allFilters };
                    })}>All</button>
                    <span className="divider-dot">•</span>
                    <button onClick={() => setAdvModal(p => ({...p, selectedColumns: [], filters: {}}))}>Clear</button>
                  </div>
                </div>
                <div className="column-checkbox-list">
                  {advModal.schema.map(s => (
                    <label key={s.column} className="col-checkbox"><input type="checkbox" checked={advModal.selectedColumns.includes(String(s.column))} onChange={() => toggleModalColumn(s.column)} /><span>{String(s.column)}</span></label>
                  ))}
                </div>
              </div>
              <div className="advanced-modal-right">
                <h4 className="pane-title">2. Row Filters</h4>
                <select className="filter-dropdown" value="" onChange={e => addModalFilter(e.target.value)}>
                  <option value="" disabled>+ Add Column Filter...</option>
                  {advModal.schema.filter(s => s.members && s.members.length > 0 && !advModal.filters[s.column]).map(s => (
                    <option key={s.column} value={s.column}>Filter by: {String(s.column)}</option>
                  ))}
                </select>
                <div className="active-filters-container">
                  {Object.entries(advModal.filters).map(([col, activeMembers]) => {
                    const allMembers = advModal.schema.find(s => s.column === col)?.members || [];
                    return (
                      <div key={col} className="filter-block">
                        <div className="filter-block-header">
                          <span className="filter-col-name">{col}</span>
                          <div className="filter-quick-actions">
                            <button onClick={() => setAllModalMembers(col, allMembers)}>All</button>
                            <button onClick={() => clearAllModalMembers(col)}>Clear</button>
                            <button className="remove-filter-btn" onClick={() => removeModalFilter(col)}>✕</button>
                          </div>
                        </div>
                        <div className="chip-grid">
                          {allMembers.map(m => {
                            const isSelected = activeMembers.includes(m);
                            return ( <button key={m} className={`member-chip ${isSelected ? 'selected' : ''}`} onClick={() => toggleModalMember(col, m)}>{isSelected && <span className="chip-check">✓</span>} {String(m)}</button> );
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(advModal.filters).length === 0 && <div className="empty-filters-msg">No row filters applied. All rows will be exported.</div>}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-outline-small" onClick={() => handleDownloadSingle(advModal.datasetId, advModal.fileName)}>Download Raw File</button>
              <button className="btn-red" onClick={executeAdvancedModalDownload}>Export Custom CSV →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}