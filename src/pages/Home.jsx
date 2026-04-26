import Hero from '../components/Hero'
import QuickStats from '../components/QuickStats'
import AlertsBar from '../components/AlertsBar'
import QuickActions from '../components/QuickActions'
import ReportMissingPanel from '../components/ReportMissingPanel'

export default function Home() {
  return (
    <>
      <Hero />
      <QuickStats />
      <AlertsBar />
      <div className="mt-12">
        <QuickActions />
      </div>
      <div className="mt-4">
        <ReportMissingPanel />
      </div>
    </>
  )
}
