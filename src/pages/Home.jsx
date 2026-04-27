import Hero from "../components/Hero";
import QuickStats from "../components/QuickStats";
import BulletinBoard from "../components/BulletinBoard";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickStats />
      <div className="mt-8">
        <BulletinBoard />
      </div>
    </>
  );
}
