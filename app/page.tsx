import { SmoothScroll } from "@/components/smooth-scroll";
import { RevealManager } from "@/components/reveal-manager";
import { Nav } from "@/components/nav";
import { YearMark } from "@/components/year-mark";
import { Hero } from "@/components/hero";
import { Roma } from "@/components/chapters/roma";
import { Colosseo } from "@/components/chapters/colosseo";
import { Volgare } from "@/components/chapters/volgare";
import { Oggi } from "@/components/chapters/oggi";
import { Formats } from "@/components/lezioni/formats";
import { About } from "@/components/lezioni/about";
import { Method } from "@/components/lezioni/method";
import { Testimonials } from "@/components/lezioni/testimonials";
import { Faq } from "@/components/lezioni/faq";
import { Contact } from "@/components/lezioni/contact";
import { Footer } from "@/components/footer";
import { showPrices } from "@/lib/content";

export default function Page() {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <YearMark />
      <main>
        <Hero />
        <Roma />
        <Colosseo />
        <Volgare />
        <Oggi />
        <About />
        <Method />
        {showPrices ? <Formats /> : null}
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <div className="grain" aria-hidden />
      <RevealManager />
    </>
  );
}
