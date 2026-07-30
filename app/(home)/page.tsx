import { BuyMeCoffee } from "@/components/home/buy-me-coffee";
import { CTA } from "@/components/home/cta";
import { Features } from "@/components/home/features";
import { Hero } from "@/components/home/hero";
import { FAQ } from "@/components/home/faq";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { softwareApplicationJsonLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <main className="flex min-h-screen flex-col">
        <Hero />
        <Features />
        <FAQ />
        <CTA />
        <BuyMeCoffee />
      </main>
      <Footer />
    </>
  );
}
