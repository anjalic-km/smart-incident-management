import Header from "../../components/landing/Header";
import Hero from "../../components/landing/Hero";
import Features from "../../components/landing/Features";
import Workflow from "../../components/landing/Workflow";
import Contact from "../../components/landing/Contact";
export default function Index() {
  return (
    <div className="bg-white text-gray-900 scroll-smooth">
      <Header />

      {/* offset for fixed header */}
      <div className="pt-16">
        <Hero />
        <Features />
        <Workflow />
        <Contact />
      </div>
    </div>
  );
}
