import React from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureShowcase } from '@/components/landing/FeatureShowcase'
import { Workflow } from '@/components/landing/Workflow'
import { EquipmentExplorer } from '@/components/landing/EquipmentExplorer'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'
import { CustomCursor } from '@/components/landing/CustomCursor'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-off-white text-charcoal selection:bg-steel-blue selection:text-pure-white">
      <CustomCursor />
      <Navbar />
      <main>
        <HeroSection />
        <FeatureShowcase />
        <Workflow />
        <EquipmentExplorer />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
