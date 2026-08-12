import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Trade from '@/components/Trade';
import Demo from '@/components/Demo';
import Doctrine from '@/components/Doctrine';
import Systems from '@/components/Systems';
import Method from '@/components/Method';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import HoldObserver from '@/components/HoldObserver';
import CursorBrackets from '@/components/CursorBrackets';
import KillSwitch from '@/components/KillSwitch';
import SystemThread from '@/components/SystemThread';
import LivingTab from '@/components/LivingTab';
import HoldSelection from '@/components/HoldSelection';
import DirectLine from '@/components/DirectLine';

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main" className="relative">
        <SystemThread />
        <Hero />
        <Trade />
        <KillSwitch />
        <Doctrine />
        <Demo />
        <Systems />
        <Method />
        <Contact />
      </main>
      <Footer />
      <HoldObserver />
      <CursorBrackets />
      <LivingTab />
      <HoldSelection />
      <DirectLine />
    </>
  );
}
