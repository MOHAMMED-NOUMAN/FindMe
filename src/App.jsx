import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import ReportPage from './pages/ReportPage'
import RescueDashboard from './pages/RescueDashboard'

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
            <Route path="/rescue" element={<RescueDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
