import Hero from "../components/Hero";
import QuickStats from "../components/QuickStats";
import AlertsBar from "../components/AlertsBar";
import BulletinBoard from "../components/BulletinBoard";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickStats />
      <AlertsBar />
      <div className="mt-8">
        <BulletinBoard />
      </div>
    </>
  );
}
