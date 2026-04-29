import { Curriculum } from '@/components/marketing/sections/curriculum';
import { Features } from '@/components/marketing/sections/features';
import { FinalCTA } from '@/components/marketing/sections/final-cta';
import { Footer } from '@/components/marketing/sections/footer';
import { Hero } from '@/components/marketing/sections/hero';
import { NavLanding } from '@/components/marketing/sections/nav-landing';
import { PorQue } from '@/components/marketing/sections/por-que';
import { Pricing } from '@/components/marketing/sections/pricing';
import { RefsStrip } from '@/components/marketing/sections/refs-strip';
import { Tour } from '@/components/marketing/sections/tour';

import '@/components/marketing/landing.css';

export function LandingPage() {
  return (
    <div className="marketing">
      <NavLanding />
      <Hero />
      <RefsStrip />
      <PorQue />
      <Features />
      <Curriculum />
      <Tour />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
