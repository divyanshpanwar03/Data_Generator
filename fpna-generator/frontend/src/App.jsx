import { useState } from "react";
import ProjectsPage from "./pages/ProjectsPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NewDatasetPage from "./pages/NewDatasetPage";
import Layout from "./components/Layout";
export default function App() {
  const [route, setRoute] = useState("projects");
  const [params, setParams] = useState({});
  
  const navigate = (newRoute, newParams = {}) => {
    setRoute(newRoute);
    setParams(newParams);
  };

  // Render the correct page based on state
  const renderPage = () => {
    switch (route) {
      // 1. Core Project Routes
      case "projects": return <ProjectsPage navigate={navigate} />;
      case "project-detail": return <ProjectDetailPage navigate={navigate} params={params} />;
      case "new-dataset": return <NewDatasetPage navigate={navigate} params={params} />;
      case "new-project": return <NewProjectPage navigate={navigate} />; // <-- Wired up New Project!

      // 2. Sidebar Navigation Placeholders
      case "templates": 
        return (
          <div style={{ padding: "40px 24px", maxWidth: 800 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#292524", letterSpacing: "-0.8px", marginBottom: 12 }}>Templates</h1>
            <p style={{ color: "#78716c", fontSize: 16, lineHeight: 1.6, padding: "24px", background: "#ffffff", border: "1px dashed #d6d3d1", borderRadius: 12 }}>
              Industry template management and overrides will go here. You can build out this page later to edit default elasticity, seasonality, and standard chart of accounts.
            </p>
          </div>
        );
        
      case "settings": 
        return (
          <div style={{ padding: "40px 24px", maxWidth: 800 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#292524", letterSpacing: "-0.8px", marginBottom: 12 }}>Settings</h1>
            <p style={{ color: "#78716c", fontSize: 16, lineHeight: 1.6, padding: "24px", background: "#ffffff", border: "1px dashed #d6d3d1", borderRadius: 12 }}>
              Workspace preferences, API keys, and user management settings will go here.
            </p>
          </div>
        );

      // 3. Fallback Route
      default: 
        return (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#ef4444" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Page not found</h2>
            <p>The route "{route}" does not exist.</p>
          </div>
        );
    }
  };

  return (
    <Layout currentRoute={route} navigate={navigate}>
      {renderPage()}
    </Layout>
  );
}