import Hero from '../components/Hero'
import QuickStats from '../components/QuickStats'
import AlertsBar from '../components/AlertsBar'
import QuickActions from '../components/QuickActions'
import BulletinBoard from '../components/BulletinBoard'
import AIMatchResults from '../components/AIMatchResults'

export default function Home() {
  return (
    <>
      <Hero />
      <QuickStats />
      <AlertsBar />
      <div className="mt-8">
        <BulletinBoard />
      </div>
      <AIMatchResults />
    </>
  )
}
