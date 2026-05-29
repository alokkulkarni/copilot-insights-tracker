import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Overview from './pages/Overview.jsx';
import ActiveUsers from './pages/ActiveUsers.jsx';
import CopilotInsights from './pages/CopilotInsights.jsx';
import Reports from './pages/Reports.jsx';
import Setup from './pages/Setup.jsx';
import { GitHubProvider } from './context/GitHubContext.jsx';
import './App.css';

function App() {
  return (
    <GitHubProvider>
      <div className="app">
        <Header />
        <main className="app-main" id="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/active-users" element={<ActiveUsers />} />
            <Route path="/copilot-insights" element={<CopilotInsights />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/setup" element={<Setup />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </GitHubProvider>
  );
}

export default App;
