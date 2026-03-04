import { getDictionary } from "@/lib/dictionaries";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemAgitation from "@/components/ProblemAgitation";
import SolutionIntro from "@/components/SolutionIntro";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import ROINumbers from "@/components/ROINumbers";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import ParallaxBackground from "@/components/ParallaxBackground";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <>
      <ParallaxBackground />
      <div className="relative z-10">
        <Navbar dict={dict} locale={locale} />
        <main>
          <Hero dict={dict} />
          <div className="section-glow-divider" />
          <ProblemAgitation dict={dict} />
          <div className="section-glow-divider" />
          <SolutionIntro dict={dict} />
          <div className="section-glow-divider" />
          <HowItWorks dict={dict} />
          <div className="section-glow-divider" />
          <Features dict={dict} />
          <div className="section-glow-divider" />
          <ROINumbers dict={dict} />
          <div className="section-glow-divider" />
          <SocialProof dict={dict} />
          <div className="section-glow-divider" />
          <FAQ dict={dict} />
          <FinalCTA dict={dict} locale={locale} />
        </main>
        <Footer dict={dict} />
        <WhatsAppFAB locale={locale} dict={dict} />
      </div>
    </>
  );
}
