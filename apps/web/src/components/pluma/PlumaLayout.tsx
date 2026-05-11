// Server Component — sem props externas
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { ChatSection } from './ChatSection'
import { SecuritySection } from './SecuritySection'
import { CTASection } from './CTASection'
import { FooterSection } from './FooterSection'

export function PlumaLayout(): JSX.Element {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ChatSection />
      <SecuritySection />
      <CTASection />
      <FooterSection />
    </>
  )
}
