import React, { useState, useEffect } from 'react';
import { api } from '../hooks/api';

export default function Layout({ children, navigate, currentRoute }) {
  const isProjectsActive = ['projects', 'project-detail', 'new-project', 'new-dataset'].includes(currentRoute);

  // State to hold the dynamic counts for our modules
  const [counts, setCounts] = useState({
    projects: 0,
    templates: 0,
    analytics: 3 // Keeping this static for now unless you have an analytics endpoint
  });

  useEffect(() => {
    // Safely fetch data from the API and update the counts
    const fetchModuleCounts = async () => {
      try {
        if (api && typeof api.getTemplates === 'function') {
          const fetchedTemplates = await api.getTemplates();
          setCounts(prev => ({ ...prev, templates: fetchedTemplates?.length || 0 }));
        }
        
        if (api && typeof api.getProjects === 'function') {
          const fetchedProjects = await api.getProjects();
          setCounts(prev => ({ ...prev, projects: fetchedProjects?.length || 0 }));
        }
      } catch (err) {
        console.error("Failed to fetch module counts for sidebar:", err);
      }
    };

    fetchModuleCounts();
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">FP&A Studio</h1>
          <span className="sidebar-subtitle">v1.0 • Enterprise</span>
        </div>

        <div className="sidebar-menu">
          <div className="menu-category">Workspace</div>
          
          <div 
            className={`menu-item ${isProjectsActive ? 'active' : ''}`} 
            onClick={() => navigate("projects")}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>⬡</span> Projects
            </div>
            {/* Dynamically renders the Projects count */}
            {counts.projects > 0 && <span className="menu-badge">{counts.projects}</span>}
          </div>

          <div className={`menu-item ${currentRoute === 'dashboard' ? 'active' : ''}`}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>◇</span> Dashboard
            </div>
          </div>
          
          <div className={`menu-item ${currentRoute === 'analytics' ? 'active' : ''}`}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>◎</span> Analytics
            </div>
            {counts.analytics > 0 && <span className="menu-badge dark">{counts.analytics}</span>}
          </div>

          <div className="menu-category">Tools</div>
          
          <div 
            className={`menu-item ${currentRoute === 'templates' ? 'active' : ''}`} 
            onClick={() => navigate("templates")}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>⊞</span> Templates
            </div>
            {/* Dynamically renders the Templates count */}
            {counts.templates > 0 && <span className="menu-badge">{counts.templates}</span>}
          </div>
          
          <div className={`menu-item ${currentRoute === 'settings' ? 'active' : ''}`} onClick={() => navigate("settings")}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>⚙</span> Settings
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}