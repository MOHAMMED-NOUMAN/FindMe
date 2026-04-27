import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import ReportPage from "./pages/ReportPage";
import RescueDashboard from "./pages/RescueDashboard";
import MatchResultsPage from "./pages/MatchResultsPage";
import ReportFoundPage from "./pages/ReportFoundPage";
import TrackReportPage from "./pages/TrackReportPage";
import SafePage from "./pages/SafePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#E0F2FE]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/track" element={<TrackReportPage />} />
            <Route path="/track/:refId" element={<TrackReportPage />} />
            <Route path="/safe" element={<SafePage />} />
            <Route path="/rescue" element={<RescueDashboard />} />
            <Route path="/results/:reportId" element={<MatchResultsPage />} />
            <Route path="/report-found" element={<ReportFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
