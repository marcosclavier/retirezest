# Landing Page Development Plan - Retire Zest

**Document Version:** 1.0
**Date:** November 14, 2025
**Project:** Retire Zest - Canadian Retirement Planning Application
**Current Status:** Landing page needed for `app/page.tsx`

---

## Table of Contents

1. [Overview](#overview)
2. [Target Audience](#target-audience)
3. [Landing Page Objectives](#landing-page-objectives)
4. [Page Structure & Sections](#page-structure--sections)
5. [Design Specifications](#design-specifications)
6. [Content Strategy](#content-strategy)
7. [Technical Implementation](#technical-implementation)
8. [Development Tasks](#development-tasks)
9. [Success Metrics](#success-metrics)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The landing page (`app/page.tsx`) is currently minimal and needs to be developed into a compelling, conversion-focused page that introduces Canadian seniors to **Retire Zest** - a comprehensive retirement planning application.

**Key Goals:**
- Communicate value proposition clearly
- Build trust with target demographic (Canadian seniors 50-70)
- Drive user registrations
- Showcase key features and benefits
- Position as the leading Canadian retirement planning tool

---

## Target Audience

### Primary Audience
- **Age:** 50-70 years old
- **Location:** Canada (all provinces)
- **Tech Savvy:** Moderate (comfortable with web apps, may need clear guidance)
- **Financial Literacy:** Varies (beginner to intermediate)
- **Pain Points:**
  - Uncertainty about retirement readiness
  - Confusion about government benefits (CPP, OAS, GIS)
  - Concern about outliving savings
  - Tax optimization complexity
  - Lack of clear retirement income projections

### User Personas

**Persona 1: "Planning Paula"**
- Age 58, plans to retire at 65
- Has RRSP and TFSA but unsure if it's enough
- Wants to know optimal CPP/OAS start ages
- Concerned about healthcare costs

**Persona 2: "Early Retirement Eric"**
- Age 55, wants to retire at 60
- Good savings, but worried about early retirement penalties
- Needs scenario planning to compare retirement ages
- Tech-comfortable, wants detailed projections

**Persona 3: "Security-Seeking Susan"**
- Age 67, already retired
- Fixed income from CPP and OAS
- Wants to ensure she won't run out of money
- Needs simple, clear guidance

---

## Landing Page Objectives

### Primary Objectives
1. **Conversions:** Drive user registrations (target: 5% conversion rate)
2. **Education:** Explain what Retire Zest does in 10 seconds
3. **Trust:** Establish credibility and security
4. **Engagement:** Keep visitors on page for 60+ seconds

### Secondary Objectives
1. Showcase key features without overwhelming
2. Address common retirement planning concerns
3. Differentiate from competitors
4. Build email list for launch updates
5. Provide social proof (when available)

---

## Page Structure & Sections

### Section 1: Hero Section (Above the Fold)
**Purpose:** Capture attention and communicate core value proposition in 3-5 seconds

**Elements:**
- **Headline:** Clear, benefit-focused (e.g., "Plan Your Canadian Retirement with Confidence")
- **Subheadline:** Expand on value (e.g., "Calculate CPP, OAS, and project your retirement income in minutes")
- **Hero Image/Illustration:** Professional, friendly, Canadian-themed
- **Primary CTA:** "Start Planning Free" (button)
- **Secondary CTA:** "See How It Works" (button/link)
- **Trust Indicators:**
  - "🇨🇦 Built for Canadians"
  - "🔒 Bank-level security"
  - "✅ 2025 government rates"

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Logo: Retire Zest]              [Login] [Get Started]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Plan Your Canadian                [Hero Image]         │
│  Retirement with Confidence        [Dashboard Preview]  │
│                                                          │
│  Calculate CPP, OAS, and project                        │
│  your retirement income in minutes                      │
│                                                          │
│  [Start Planning Free →]  [See How It Works]            │
│                                                          │
│  🇨🇦 Built for Canadians  🔒 Secure  ✅ 2025 Rates     │
└─────────────────────────────────────────────────────────┘
```

---

### Section 2: Problem Statement
**Purpose:** Resonate with visitor pain points

**Headline:** "Retirement Planning Doesn't Have to Be Overwhelming"

**Content:** 3-4 common problems with icons
- ❓ "When should I start CPP and OAS?"
- 💰 "Will my savings last 30+ years?"
- 📊 "How much tax will I pay in retirement?"
- 🤔 "What's the best withdrawal strategy?"

**Visual:** Simple icon grid or 2x2 layout

---

### Section 3: Solution Overview
**Purpose:** Introduce Retire Zest as the solution

**Headline:** "Retire Zest Gives You Clear Answers"

**Content:** Brief overview paragraph
> "Retire Zest is a comprehensive retirement planning tool designed specifically for Canadian seniors. Our calculators use the latest 2025 government rates to project your CPP, OAS, and GIS benefits, while our powerful projection engine shows you exactly how your savings will support your retirement lifestyle."

**Key Benefits (3 columns):**
1. **Accurate Projections**
   - Government benefit calculators (CPP, OAS, GIS)
   - Year-by-year income and expense tracking
   - Tax-efficient withdrawal strategies

2. **Easy to Use**
   - Step-by-step guided setup
   - Visual charts and graphs
   - Professional PDF reports

3. **Built for Canadians**
   - Provincial tax calculations
   - RRSP, TFSA, RRIF support
   - Canadian government benefit rules

---

### Section 4: Key Features Showcase
**Purpose:** Highlight core features with visuals

**Headline:** "Everything You Need to Plan Your Retirement"

**Features (6 cards with icons/screenshots):**

1. **CPP Optimizer**
   - Calculate your CPP based on earnings history
   - Find optimal start age (60-70)
   - See break-even analysis
   - *Screenshot: CPP calculator page*

2. **OAS & GIS Calculator**
   - Estimate OAS based on residency
   - Calculate income clawback
   - Determine GIS eligibility
   - *Screenshot: OAS results*

3. **Retirement Projection**
   - Year-by-year income and expenses
   - Asset balance tracking to age 95+
   - Tax calculations (federal + provincial)
   - *Screenshot: Projection charts*

4. **Scenario Planning**
   - Compare multiple retirement plans
   - Test "what-if" scenarios
   - Retirement age comparisons
   - *Screenshot: Scenario comparison*

5. **Financial Profile**
   - Track income, assets, expenses, debts
   - RRSP, TFSA, non-registered accounts
   - Real estate and pensions
   - *Screenshot: Profile dashboard*

6. **Professional Reports**
   - Generate PDF retirement reports
   - Executive summaries
   - Share with financial advisors
   - *Screenshot: PDF report*

**Layout:** 2x3 grid on desktop, single column on mobile

---

### Section 5: How It Works (Process)
**Purpose:** Show simplicity and reduce friction

**Headline:** "Start Planning in 3 Simple Steps"

**Steps (horizontal timeline):**
```
1. Create Account          2. Enter Your Info         3. Get Your Plan
   (30 seconds)               (5 minutes)                (Instantly)

[Icon: User profile]       [Icon: Form]               [Icon: Chart/Report]

Create a free account      Add your income,           View projections,
with just your email       assets, and retirement     compare scenarios,
                          goals                       download reports
```

**CTA Below:** [Start Planning Free →]

---

### Section 6: Feature Deep Dive (Expandable/Tabs)
**Purpose:** Provide more detail for interested visitors

**Headline:** "Powerful Features, Simple Interface"

**Tabbed Content or Accordion:**

**Tab 1: Government Benefits**
- CPP calculation with age adjustments (-36% at 60, +42% at 70)
- OAS residency requirements and clawback calculations
- GIS income testing for low-income seniors
- 2025 maximum amounts displayed

**Tab 2: Tax Optimization**
- Federal and provincial tax brackets
- Tax credits (basic personal, age, pension)
- Withdrawal sequencing (TFSA → Non-Reg → RRSP/RRIF)
- RRIF minimum withdrawal calculations

**Tab 3: Investment Projections**
- Configurable return rates (conservative, moderate, aggressive)
- Inflation adjustments
- Asset depletion warnings
- Estate value projections

**Tab 4: Reports & Analytics**
- Interactive charts (income vs. expenses, asset balance)
- Year-by-year breakdowns
- PDF report generation
- Printable summaries

---

### Section 7: Trust & Credibility
**Purpose:** Build confidence in the tool

**Headline:** "Secure, Private, and Accurate"

**Trust Elements (4 columns):**

1. **🔒 Bank-Level Security**
   - 256-bit encryption
   - Secure authentication
   - Privacy-first design
   - No data selling

2. **🇨🇦 Canadian-Specific**
   - 2025 government rates
   - All provinces supported
   - CRA-aligned calculations
   - PIPEDA compliant

3. **📊 Accurate Calculations**
   - Verified against government calculators
   - Regular updates
   - Transparent methodology
   - Financial planner reviewed

4. **🆓 Free to Start**
   - No credit card required
   - Full feature access
   - Export your data anytime
   - Cancel anytime

---

### Section 8: FAQ Section
**Purpose:** Address common objections and questions

**Headline:** "Frequently Asked Questions"

**Questions (expandable accordions):**

1. **Is Retire Zest really free?**
   > Yes! Retire Zest is currently free to use with full access to all features. We may introduce premium features in the future, but core retirement planning will remain free.

2. **How accurate are the CPP and OAS calculations?**
   > Our calculators use official 2025 government rates and formulas. While we provide accurate estimates, your actual benefits may vary based on your complete earnings history. We recommend verifying with Service Canada.

3. **Is my financial data secure?**
   > Absolutely. We use bank-level 256-bit encryption, secure authentication, and never sell your data. Your information is stored securely and only accessible by you.

4. **Do I need to provide bank account information?**
   > No. You manually enter your financial information (income, assets, expenses). We never ask for bank account numbers, passwords, or access to your accounts.

5. **Can I use this if I'm already retired?**
   > Yes! Retire Zest works for pre-retirees and current retirees. You can project your remaining retirement years and ensure your savings will last.

6. **Which provinces are supported?**
   > Currently, our tax calculator supports Ontario, with other provinces coming soon. CPP, OAS, and GIS calculations work for all Canadians.

7. **Can I share my plan with my financial advisor?**
   > Yes! You can generate PDF reports to share with your advisor, spouse, or family members.

8. **What if my situation changes?**
   > You can update your profile anytime and create multiple scenarios to compare different retirement plans.

9. **Is this financial advice?**
   > No. Retire Zest is an educational planning tool. It does not provide personalized financial advice. Always consult a licensed financial advisor for specific recommendations.

10. **How often are government rates updated?**
    > We update CPP, OAS, GIS, and tax rates annually when the government releases new figures (typically January).

---

### Section 9: Social Proof (Future)
**Purpose:** Show credibility through user testimonials

**Headline:** "Trusted by Canadian Seniors" *(Phase 2 - after user base)*

**Elements:**
- User testimonials (3-4 quotes)
- Star ratings
- Usage statistics ("10,000+ retirement plans created")
- Media mentions (if applicable)

**Placeholder for MVP:**
- Skip this section initially
- Add after 100+ active users
- Collect testimonials via email survey

---

### Section 10: Final CTA Section
**Purpose:** Drive conversions before footer

**Design:** Full-width colored section (gradient background)

**Content:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│           Ready to Plan Your Retirement?                │
│                                                          │
│    Join thousands of Canadians gaining clarity          │
│         about their retirement future                   │
│                                                          │
│           [Start Planning Free - It's Easy →]           │
│                                                          │
│         No credit card required • 5-minute setup        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### Section 11: Footer
**Purpose:** Navigation, legal, contact

**Layout (4 columns):**

**Column 1: Retire Zest**
- Logo
- Tagline: "Canadian Retirement Planning Made Simple"
- Copyright © 2025

**Column 2: Product**
- Features
- How It Works
- Pricing *(link to free explanation)*
- FAQ

**Column 3: Resources**
- Blog *(future)*
- Help Center *(future)*
- Government Resources (CPP, OAS links)
- Contact

**Column 4: Legal**
- Privacy Policy
- Terms of Service
- Security
- Accessibility

**Social Media Icons:** *(future)*
- LinkedIn
- Facebook
- Twitter/X

**Bottom Bar:**
```
Built with ❤️ for Canadians | Last updated: January 2025 (2025 tax rates)
```

---

## Design Specifications

### Color Palette

**Primary Brand Colors:**
- **Primary Blue:** `#2563eb` (Trust, stability, Canadian)
- **Secondary Green:** `#10b981` (Growth, prosperity, positive)
- **Accent Orange:** `#f59e0b` (Energy, optimism)

**Neutral Colors:**
- **Dark Gray:** `#1f2937` (Headings, text)
- **Medium Gray:** `#6b7280` (Body text)
- **Light Gray:** `#f3f4f6` (Backgrounds, sections)
- **White:** `#ffffff` (Cards, content areas)

**Semantic Colors:**
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Orange)
- **Error:** `#ef4444` (Red)
- **Info:** `#3b82f6` (Blue)

### Typography

**Headings:**
- **Font:** Inter, system-ui, sans-serif
- **H1:** 3.75rem (60px), font-weight: 800, line-height: 1.1
- **H2:** 3rem (48px), font-weight: 700, line-height: 1.2
- **H3:** 2.25rem (36px), font-weight: 600, line-height: 1.3
- **H4:** 1.5rem (24px), font-weight: 600, line-height: 1.4

**Body Text:**
- **Font:** Inter, system-ui, sans-serif
- **Base:** 1rem (16px), font-weight: 400, line-height: 1.6
- **Large:** 1.125rem (18px), line-height: 1.7
- **Small:** 0.875rem (14px), line-height: 1.5

**Responsive Typography:**
- Mobile H1: 2.5rem (40px)
- Mobile H2: 2rem (32px)

### Spacing System
- **Base unit:** 4px (0.25rem)
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px
- **Section spacing:** 96px (desktop), 64px (mobile)
- **Component spacing:** 24-32px

### Buttons

**Primary Button:**
```css
background: #2563eb
color: white
padding: 16px 32px
border-radius: 8px
font-size: 18px
font-weight: 600
hover: #1d4ed8
shadow: 0 4px 6px rgba(0,0,0,0.1)
```

**Secondary Button:**
```css
background: transparent
border: 2px solid #2563eb
color: #2563eb
padding: 14px 30px
border-radius: 8px
hover: background #2563eb, color white
```

### Cards
```css
background: white
border-radius: 12px
padding: 32px
shadow: 0 1px 3px rgba(0,0,0,0.1)
hover: shadow: 0 10px 20px rgba(0,0,0,0.1)
transition: all 0.3s ease
```

### Icons
- **Library:** Heroicons or Lucide React
- **Size:** 24px standard, 32px for feature icons, 48px for section headers
- **Style:** Outline for minimal, solid for emphasis

### Imagery

**Hero Image Options:**
1. **Dashboard Screenshot:** Show actual app interface (builds credibility)
2. **Illustration:** Happy seniors with financial charts (approachable)
3. **Photo:** Diverse Canadian seniors (authentic, relatable)

**Style Guidelines:**
- Authentic, not stock-photo-looking
- Diverse representation (age, ethnicity, gender)
- Canadian context (subtle maple leaf, Canadian imagery)
- Professional but friendly tone

### Responsive Breakpoints
- **Mobile:** < 640px (single column)
- **Tablet:** 640px - 1024px (2 columns)
- **Desktop:** 1024px+ (3-4 columns)
- **Max width:** 1280px (centered container)

### Animation & Transitions
- **Scroll animations:** Fade in on scroll (subtle)
- **Button hovers:** 200ms ease transition
- **Card hovers:** Transform scale 1.02, shadow increase
- **Page transitions:** Smooth, 300ms
- **Keep it subtle:** Senior audience prefers clarity over flashy

---

## Content Strategy

### Tone & Voice

**Brand Personality:**
- **Trustworthy:** Like a knowledgeable financial advisor
- **Clear:** No jargon, simple explanations
- **Supportive:** Empowering, not intimidating
- **Canadian:** Proudly Canadian, culturally relevant
- **Optimistic:** Positive about retirement planning

**Writing Guidelines:**
- Use "you" and "your" (personal, conversational)
- Avoid financial jargon or explain it clearly
- Short sentences and paragraphs (max 3 lines)
- Active voice preferred
- Numbers and data for credibility
- Bullet points over dense paragraphs

**Examples:**

❌ **Don't:** "Leverage our sophisticated algorithmic projection engine to optimize your retirement asset allocation."

✅ **Do:** "See exactly how your savings will support your retirement, year by year."

❌ **Don't:** "Utilize our CPP optimization module to determine the actuarially optimal pension commencement age."

✅ **Do:** "Find the best age to start your CPP—whether that's 60, 65, or 70."

### Headlines Strategy

**Headline Formula:** [Benefit] + [How] + [For Whom]

**Examples:**
- "Plan Your Canadian Retirement with Confidence" *(current top choice)*
- "See Exactly How Your Retirement Will Look"
- "Calculate Your CPP and OAS in Minutes"
- "Make Smarter Retirement Decisions with Clear Projections"

**Subheadline Formula:** Expand on how + address pain point

**Examples:**
- "Calculate CPP, OAS, and project your retirement income in minutes—no spreadsheets required."
- "Answer all your retirement questions with accurate projections built for Canadian seniors."

### Call-to-Action (CTA) Strategy

**Primary CTA:** "Start Planning Free"
- Emphasizes no-cost, no-risk
- Action-oriented
- Clear benefit

**Alternative CTAs:**
- "Get Your Free Retirement Plan"
- "Calculate Your Retirement Income"
- "See Your Retirement Projection"
- "Start My Plan"

**Secondary CTA:** "See How It Works"
- Lower commitment
- Educational
- Scroll to demo/features section

### SEO Strategy

**Target Keywords:**
- Canadian retirement planning
- CPP calculator
- OAS calculator
- GIS calculator
- Retirement income calculator Canada
- RRSP withdrawal calculator
- Retirement planning tool Canada

**Meta Tags:**
```html
<title>Retire Zest - Canadian Retirement Planning Calculator | CPP, OAS, GIS</title>
<meta name="description" content="Free Canadian retirement planning tool. Calculate CPP, OAS, and GIS benefits. Project your retirement income with accurate tax calculations. Built for Canadian seniors.">
<meta name="keywords" content="retirement planning Canada, CPP calculator, OAS calculator, retirement income, Canadian seniors">
```

**Open Graph Tags (Social Sharing):**
```html
<meta property="og:title" content="Retire Zest - Plan Your Canadian Retirement">
<meta property="og:description" content="Calculate your CPP, OAS, and project your retirement income with Canada's easiest retirement planning tool.">
<meta property="og:image" content="/og-image.png">
<meta property="og:type" content="website">
```

---

## Technical Implementation

### File Structure

```
webapp/
├── app/
│   ├── page.tsx                          # Landing page (THIS FILE)
│   └── layout.tsx                        # Root layout (minimal for landing)
│
├── components/
│   ├── landing/                          # NEW: Landing page components
│   │   ├── HeroSection.tsx               # Hero with CTA
│   │   ├── ProblemSection.tsx            # Pain points
│   │   ├── SolutionSection.tsx           # Benefits overview
│   │   ├── FeaturesShowcase.tsx          # 6 feature cards
│   │   ├── HowItWorksSection.tsx         # 3-step process
│   │   ├── FeatureDeepDive.tsx           # Tabbed content
│   │   ├── TrustSection.tsx              # Security & credibility
│   │   ├── FAQSection.tsx                # Accordion FAQ
│   │   ├── FinalCTASection.tsx           # Pre-footer CTA
│   │   └── LandingFooter.tsx             # Footer (different from dashboard)
│   │
│   └── ui/                               # Existing shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       └── accordion.tsx                 # For FAQ
│
├── public/
│   ├── images/
│   │   ├── landing/
│   │   │   ├── hero-illustration.svg     # Hero visual
│   │   │   ├── dashboard-screenshot.png  # App preview
│   │   │   ├── cpp-calculator.png        # Feature screenshot
│   │   │   ├── oas-results.png           # Feature screenshot
│   │   │   ├── projection-chart.png      # Feature screenshot
│   │   │   └── scenario-comparison.png   # Feature screenshot
│   │   │
│   │   └── icons/
│   │       ├── security-icon.svg
│   │       ├── canada-flag.svg
│   │       └── checkmark-icon.svg
│   │
│   └── og-image.png                      # Social sharing image (1200x630)
│
└── styles/
    └── landing.css                       # Landing-specific styles (if needed)
```

### Component Architecture

**1. Landing Page Structure (`app/page.tsx`)**
```tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesShowcase />
      <HowItWorksSection />
      <FeatureDeepDive />
      <TrustSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
```

**2. Hero Section Component (`components/landing/HeroSection.tsx`)**
```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text Content */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Plan Your Canadian Retirement with{' '}
              <span className="text-blue-600">Confidence</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Calculate CPP, OAS, and project your retirement income in
              minutes—no spreadsheets required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Start Planning Free →
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇨🇦</span>
                <span className="text-sm font-medium text-gray-700">Built for Canadians</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span className="text-sm font-medium text-gray-700">Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-sm font-medium text-gray-700">2025 Government Rates</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image/Screenshot */}
          <div className="relative">
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border-8 border-white">
              <Image
                src="/images/landing/dashboard-screenshot.png"
                alt="Retire Zest Dashboard Preview"
                width={800}
                height={600}
                className="w-full h-auto"
              />
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-200 rounded-full opacity-50 blur-2xl"></div>
          </div>

        </div>
      </div>
    </section>
  );
}
```

**3. Features Showcase Component (`components/landing/FeaturesShowcase.tsx`)**
```tsx
'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';

const features = [
  {
    title: 'CPP Optimizer',
    description: 'Calculate your CPP based on earnings history. Find the optimal start age (60-70) with break-even analysis.',
    icon: '📊',
    screenshot: '/images/landing/cpp-calculator.png',
  },
  {
    title: 'OAS & GIS Calculator',
    description: 'Estimate OAS based on residency. Calculate income clawback and determine GIS eligibility.',
    icon: '💰',
    screenshot: '/images/landing/oas-results.png',
  },
  {
    title: 'Retirement Projection',
    description: 'Year-by-year income and expenses. Asset balance tracking to age 95+ with full tax calculations.',
    icon: '📈',
    screenshot: '/images/landing/projection-chart.png',
  },
  {
    title: 'Scenario Planning',
    description: 'Compare multiple retirement plans. Test what-if scenarios and retirement age comparisons.',
    icon: '🔄',
    screenshot: '/images/landing/scenario-comparison.png',
  },
  {
    title: 'Financial Profile',
    description: 'Track income, assets, expenses, and debts. Manage RRSP, TFSA, and non-registered accounts.',
    icon: '💼',
    screenshot: '/images/landing/profile-screenshot.png',
  },
  {
    title: 'Professional Reports',
    description: 'Generate PDF retirement reports with executive summaries. Share with financial advisors.',
    icon: '📄',
    screenshot: '/images/landing/report-screenshot.png',
  },
];

export default function FeaturesShowcase() {
  return (
    <section className="py-20 bg-gray-50" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Plan Your Retirement
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools designed specifically for Canadian seniors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>
              {/* Optional: Add screenshot preview */}
              {/* <div className="mt-4 rounded-lg overflow-hidden border">
                <Image
                  src={feature.screenshot}
                  alt={feature.title}
                  width={400}
                  height={300}
                  className="w-full h-auto"
                />
              </div> */}
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
```

**4. FAQ Section Component (`components/landing/FAQSection.tsx`)**
```tsx
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is Retire Zest really free?',
    answer: 'Yes! Retire Zest is currently free to use with full access to all features. We may introduce premium features in the future, but core retirement planning will remain free.',
  },
  {
    question: 'How accurate are the CPP and OAS calculations?',
    answer: 'Our calculators use official 2025 government rates and formulas. While we provide accurate estimates, your actual benefits may vary based on your complete earnings history. We recommend verifying with Service Canada.',
  },
  // ... more FAQs
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Retire Zest
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

      </div>
    </section>
  );
}
```

### Navigation Bar

**Landing Page Navigation (`components/landing/LandingNav.tsx`)**
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">Retire Zest</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-blue-600 transition">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition">
              How It Works
            </a>
            <a href="#faq" className="text-gray-700 hover:text-blue-600 transition">
              FAQ
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-700">Features</a>
            <a href="#how-it-works" className="block text-gray-700">How It Works</a>
            <a href="#faq" className="block text-gray-700">FAQ</a>
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full">Log In</Button>
            </Link>
            <Link href="/register" className="block">
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
```

### Performance Optimization

**Image Optimization:**
- Use Next.js `<Image>` component for automatic optimization
- Lazy load images below the fold
- Use WebP format for smaller file sizes
- Provide proper width/height to prevent layout shift

**Code Splitting:**
- Landing page components in separate files
- Lazy load FAQ accordion content
- Dynamic imports for heavy components

**SEO Optimization:**
- Semantic HTML (h1, h2, section, article)
- Descriptive alt text for images
- Proper meta tags and Open Graph
- Schema.org structured data (Organization, WebPage)

**Example Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Retire Zest",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CAD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}
```

---

## Development Tasks

### Phase 1: Foundation (Week 1)
**Priority:** High | **Estimated Time:** 16 hours

- [x] **Task 1.1:** Set up landing page component structure
  - Create `components/landing/` directory
  - Create skeleton components for all sections
  - Set up basic routing in `app/page.tsx`
  - **Time:** 2 hours

- [x] **Task 1.2:** Design system setup
  - Define color palette in Tailwind config
  - Set up typography scale
  - Create reusable button variants
  - **Time:** 2 hours

- [x] **Task 1.3:** Navigation bar
  - Build responsive LandingNav component
  - Add smooth scroll to sections
  - Implement mobile hamburger menu
  - **Time:** 3 hours

- [x] **Task 1.4:** Hero section
  - Build HeroSection component
  - Add headline, subheadline, CTAs
  - Create hero layout (text + image)
  - Add trust indicators
  - **Time:** 4 hours

- [x] **Task 1.5:** Footer
  - Build LandingFooter component
  - Add 4-column layout
  - Add legal links (Privacy, Terms)
  - **Time:** 2 hours

- [x] **Task 1.6:** Responsive testing
  - Test on mobile, tablet, desktop
  - Fix layout issues
  - **Time:** 3 hours

---

### Phase 2: Core Content Sections (Week 2)
**Priority:** High | **Estimated Time:** 20 hours

- [ ] **Task 2.1:** Problem section
  - Build ProblemSection component
  - Add 4 pain point cards with icons
  - Responsive grid layout
  - **Time:** 3 hours

- [ ] **Task 2.2:** Solution section
  - Build SolutionSection component
  - Add 3 benefit columns
  - Add overview paragraph
  - **Time:** 3 hours

- [ ] **Task 2.3:** Features showcase
  - Build FeaturesShowcase component
  - Create 6 feature cards
  - Add feature icons/emojis
  - Implement hover effects
  - **Time:** 5 hours

- [ ] **Task 2.4:** How It Works section
  - Build HowItWorksSection component
  - Create 3-step timeline
  - Add step icons and descriptions
  - **Time:** 4 hours

- [ ] **Task 2.5:** Trust section
  - Build TrustSection component
  - Add 4 trust pillars
  - Add icons and badges
  - **Time:** 3 hours

- [ ] **Task 2.6:** Final CTA section
  - Build FinalCTASection component
  - Add gradient background
  - Large CTA button
  - **Time:** 2 hours

---

### Phase 3: Interactive Elements (Week 3)
**Priority:** Medium | **Estimated Time:** 16 hours

- [ ] **Task 3.1:** FAQ section
  - Build FAQSection component
  - Implement Accordion component (shadcn)
  - Add 10 FAQ items
  - Add expand/collapse animations
  - **Time:** 4 hours

- [ ] **Task 3.2:** Feature deep dive (tabs)
  - Build FeatureDeepDive component
  - Implement tab navigation
  - Add 4 tabbed content sections
  - **Time:** 5 hours

- [ ] **Task 3.3:** Scroll animations
  - Install Framer Motion or AOS
  - Add fade-in animations on scroll
  - Keep animations subtle
  - **Time:** 4 hours

- [ ] **Task 3.4:** Smooth scrolling
  - Implement smooth scroll for anchor links
  - Add "Back to top" button
  - **Time:** 2 hours

- [ ] **Task 3.5:** Mobile menu interactions
  - Refine mobile navigation
  - Add close on link click
  - Add menu overlay
  - **Time:** 1 hour

---

### Phase 4: Visual Assets (Week 4)
**Priority:** Medium | **Estimated Time:** 12 hours

- [ ] **Task 4.1:** Hero image/illustration
  - Create or source hero visual
  - Option A: Design custom illustration
  - Option B: Take dashboard screenshot
  - Option C: Find stock photo
  - Optimize for web (WebP)
  - **Time:** 4 hours

- [ ] **Task 4.2:** Feature screenshots
  - Take 6 high-quality screenshots of app features
  - Crop and optimize images
  - Add device frames (optional)
  - **Time:** 3 hours

- [ ] **Task 4.3:** Icons and graphics
  - Create or source section icons
  - Add trust badges
  - Canadian flag graphics
  - **Time:** 2 hours

- [ ] **Task 4.4:** Social sharing image
  - Design Open Graph image (1200x630)
  - Include logo, tagline, visual
  - **Time:** 2 hours

- [ ] **Task 4.5:** Favicon
  - Create favicon.ico
  - Create apple-touch-icon
  - **Time:** 1 hour

---

### Phase 5: Content & Copywriting (Ongoing)
**Priority:** High | **Estimated Time:** 8 hours

- [ ] **Task 5.1:** Write headline variations
  - Create 5-10 headline options
  - A/B test if possible
  - **Time:** 1 hour

- [ ] **Task 5.2:** Write section copy
  - Problem section text
  - Solution section text
  - Feature descriptions
  - **Time:** 3 hours

- [ ] **Task 5.3:** Write FAQ content
  - Research common questions
  - Write 10 comprehensive answers
  - **Time:** 2 hours

- [ ] **Task 5.4:** Proofread and edit
  - Check for typos
  - Ensure consistent tone
  - Simplify complex language
  - **Time:** 2 hours

---

### Phase 6: SEO & Metadata (Week 5)
**Priority:** Medium | **Estimated Time:** 6 hours

- [ ] **Task 6.1:** Meta tags
  - Add title, description, keywords
  - Add Open Graph tags
  - Add Twitter Card tags
  - **Time:** 2 hours

- [ ] **Task 6.2:** Structured data
  - Add JSON-LD schema
  - Organization markup
  - SoftwareApplication markup
  - **Time:** 2 hours

- [ ] **Task 6.3:** Sitemap and robots.txt
  - Generate sitemap.xml
  - Create robots.txt
  - **Time:** 1 hour

- [ ] **Task 6.4:** Accessibility audit
  - Check WCAG compliance
  - Add alt text to images
  - Test keyboard navigation
  - Check color contrast
  - **Time:** 1 hour

---

### Phase 7: Testing & Polish (Week 6)
**Priority:** High | **Estimated Time:** 12 hours

- [ ] **Task 7.1:** Cross-browser testing
  - Test Chrome, Firefox, Safari, Edge
  - Fix browser-specific issues
  - **Time:** 3 hours

- [ ] **Task 7.2:** Mobile testing
  - Test iOS Safari
  - Test Android Chrome
  - Fix mobile-specific bugs
  - **Time:** 3 hours

- [ ] **Task 7.3:** Performance optimization
  - Run Lighthouse audit
  - Optimize images further
  - Reduce bundle size
  - Target 90+ performance score
  - **Time:** 3 hours

- [ ] **Task 7.4:** User testing
  - Get 5-10 people to review
  - Collect feedback
  - Make adjustments
  - **Time:** 3 hours

---

### Phase 8: Launch Preparation (Week 6)
**Priority:** High | **Estimated Time:** 6 hours

- [ ] **Task 8.1:** Analytics setup
  - Add Google Analytics 4
  - Set up conversion tracking
  - Track button clicks
  - **Time:** 2 hours

- [ ] **Task 8.2:** Legal pages
  - Create Privacy Policy page
  - Create Terms of Service page
  - Add cookie consent banner
  - **Time:** 3 hours

- [ ] **Task 8.3:** Pre-launch checklist
  - Test all CTAs lead to /register
  - Verify all links work
  - Check spelling and grammar
  - Final QA pass
  - **Time:** 1 hour

---

### Total Estimated Time: **96 hours (~12 days of full-time work)**

**Recommended Timeline:** 6 weeks with 2-3 hours/day

---

## Success Metrics

### Primary KPIs

**1. Conversion Rate**
- **Target:** 5% of visitors register
- **Measurement:** (Registrations / Unique Visitors) × 100
- **Tools:** Google Analytics, conversion tracking

**2. Time on Page**
- **Target:** 60+ seconds average
- **Benchmark:** < 10 seconds = bounce, > 2 minutes = engaged
- **Indicates:** Content relevance and engagement

**3. Scroll Depth**
- **Target:** 50% of visitors scroll past hero
- **Target:** 25% reach FAQ section
- **Measurement:** Scroll tracking events

**4. Click-Through Rate (CTR)**
- **Primary CTA (Hero):** 10-15%
- **Secondary CTA (Final):** 5-8%
- **Feature Links:** 2-5%

### Secondary KPIs

**5. Bounce Rate**
- **Target:** < 40%
- **Benchmark:** 40-55% = average, < 40% = good

**6. Traffic Sources**
- Organic search: 40%
- Direct: 30%
- Referral: 20%
- Social: 10%

**7. Page Load Speed**
- **Target:** < 2 seconds on desktop
- **Target:** < 3 seconds on mobile
- **Measurement:** Lighthouse, PageSpeed Insights

**8. User Feedback**
- **Target:** 4.5+ star rating (when reviews are added)
- **Target:** < 5% negative feedback

### A/B Testing Opportunities

**Test 1: Headlines**
- Variant A: "Plan Your Canadian Retirement with Confidence"
- Variant B: "See Exactly How Your Retirement Will Look"
- Metric: CTA click rate

**Test 2: Hero CTA**
- Variant A: "Start Planning Free"
- Variant B: "Get Your Free Retirement Plan"
- Metric: Click-through rate

**Test 3: Hero Layout**
- Variant A: Text left, image right
- Variant B: Centered text, background image
- Metric: Time on page, scroll depth

**Test 4: Feature Section**
- Variant A: 6 cards with icons only
- Variant B: 6 cards with screenshots
- Metric: Engagement, scroll depth

---

## Future Enhancements

### Phase 2 Improvements (Post-Launch)

**1. Social Proof Section** *(After 100+ users)*
- User testimonials (3-5 quotes)
- Star ratings
- "10,000+ retirement plans created" stats
- Media mentions

**2. Video Explainer** *(Month 2)*
- 60-90 second demo video
- Shows app walkthrough
- Embedded in Hero or How It Works section
- Increases engagement by 20-40%

**3. Interactive Calculator Preview** *(Month 3)*
- Mini CPP calculator on landing page
- Shows sample calculation without login
- Encourages registration to see full results

**4. Blog/Resources Section** *(Month 4)*
- Add "Resources" menu item
- Link to blog articles about retirement
- SEO content marketing
- Examples: "When to Start CPP", "RRSP vs TFSA"

**5. Live Chat Support** *(Month 6)*
- Add Intercom or similar
- Answer questions in real-time
- Increase trust and conversions

**6. Comparison Table** *(Month 3)*
- "Retire Zest vs. Spreadsheets"
- "Retire Zest vs. Financial Advisors"
- Highlight benefits

**7. Case Studies** *(Month 6)*
- "How Paula planned to retire at 62"
- Real user stories (anonymized)
- Detailed walkthroughs

**8. Multilingual Support** *(Month 12)*
- French translation (Canadian requirement)
- Language toggle in nav

### Advanced Features

**9. Exit-Intent Popup** *(Month 2)*
- Trigger when user about to leave
- Offer incentive (e.g., "Get a free retirement checklist")
- Collect email for newsletter

**10. Pricing Page** *(If freemium model added)*
- Free vs. Premium comparison
- Annual vs. monthly pricing
- "Most Popular" badge

**11. Trust Badges** *(When available)*
- "As seen in..." media logos
- Certifications (SOC 2, PIPEDA)
- Partnership badges

**12. Animated Illustrations** *(Month 6)*
- Subtle animations (Lottie files)
- Make page more dynamic
- Keep senior-friendly (not overwhelming)

---

## Appendix A: Content Templates

### Email Capture Form (Future)

**Headline:** "Get Retirement Planning Tips Delivered to Your Inbox"

**Form Fields:**
- Email address (required)
- First name (optional)
- Age range dropdown (optional)

**Submit Button:** "Send Me Tips"

**Privacy Note:** "We respect your privacy. Unsubscribe anytime."

---

### Newsletter Welcome Email (Future)

**Subject:** "Welcome to Retire Zest! Here's your free retirement checklist"

**Body:**
```
Hi [Name],

Welcome to Retire Zest!

You're now part of a growing community of Canadians taking control of their retirement planning.

Here's your free retirement planning checklist to get started:

✅ Know your CPP contribution history
✅ Understand OAS residency requirements
✅ Calculate your retirement income needs
✅ Review RRSP and TFSA balances
✅ Create a withdrawal strategy

Ready to dive deeper? Create your free Retire Zest account:
[Start Planning →]

Have questions? Just reply to this email—we're here to help!

Cheers,
The Retire Zest Team

P.S. Our next email will cover "The 3 Biggest CPP Mistakes Canadians Make"
```

---

## Appendix B: Legal Pages (Outlines)

### Privacy Policy (Key Sections)

1. Information We Collect
   - Account information (email, name, date of birth)
   - Financial data you enter
   - Usage data (analytics)

2. How We Use Your Information
   - Provide retirement projections
   - Improve our service
   - Send important updates

3. Data Security
   - Encryption (256-bit)
   - Secure servers
   - No data selling

4. Your Rights
   - Access your data
   - Delete your account
   - Export your data

5. Cookies
   - Authentication cookies
   - Analytics cookies
   - How to disable

6. Contact Us
   - Email: privacy@retirezest.ca

---

### Terms of Service (Key Sections)

1. Acceptance of Terms
2. Description of Service
   - Educational tool, not financial advice
3. User Responsibilities
   - Accurate information
   - Account security
4. Disclaimers
   - No guarantee of accuracy
   - Consult financial advisor
5. Limitation of Liability
6. Changes to Terms
7. Governing Law (Canadian law)

---

## Appendix C: Competitor Analysis

### Key Competitors (Canadian Market)

**1. Wealthsimple Retirement Calculator**
- **Strengths:** Brand recognition, simple UX
- **Weaknesses:** Basic calculations, no CPP optimization
- **Differentiation:** Retire Zest offers deeper CPP/OAS/GIS analysis

**2. Government of Canada CPP Calculator**
- **Strengths:** Official, trusted source
- **Weaknesses:** Clunky interface, no holistic planning
- **Differentiation:** Retire Zest combines all benefits + projections

**3. Manulife RetirementPlus Calculator**
- **Strengths:** Established financial brand
- **Weaknesses:** Product sales focus, complex
- **Differentiation:** Retire Zest is independent, no sales agenda

**4. Excel Spreadsheets / Manual Calculation**
- **Strengths:** Free, customizable
- **Weaknesses:** Error-prone, time-consuming, no updates
- **Differentiation:** Retire Zest is automated, accurate, always updated

### Competitive Advantages for Landing Page

- **Canadian-Specific:** Built exclusively for Canadian rules
- **Comprehensive:** All-in-one tool (not just one calculator)
- **Free:** No credit card, no upsells
- **Modern UX:** Better than government tools
- **Privacy-Focused:** No data selling
- **Up-to-Date:** 2025 rates automatically applied

---

## Appendix D: Resource Links

### Design Inspiration

**Landing Page Examples:**
- https://linear.app (clean, modern)
- https://stripe.com (professional, trustworthy)
- https://notion.so (simple, benefits-focused)
- https://mailchimp.com (friendly, accessible)

**Retirement Planning Sites:**
- https://www.wealthsimple.com/en-ca/tool/retirement-calculator
- https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
- https://www.manulife.ca/personal/plan-and-learn/retirement.html

### Icon Resources

- **Heroicons:** https://heroicons.com/ (free, MIT license)
- **Lucide:** https://lucide.dev/ (free, ISC license)
- **Font Awesome:** https://fontawesome.com/ (free tier available)

### Image Resources

- **Unsplash:** https://unsplash.com/ (free stock photos)
- **Pexels:** https://www.pexels.com/ (free stock photos)
- **unDraw:** https://undraw.co/ (free illustrations)
- **Storyset:** https://storyset.com/ (free customizable illustrations)

### Tools

- **Figma:** Design mockups (free tier)
- **Canva:** Social media graphics (free tier)
- **TinyPNG:** Image compression
- **Google PageSpeed Insights:** Performance testing
- **WAVE:** Accessibility testing

---

## Document Approval & Next Steps

**Prepared By:** Development Team
**Date:** November 14, 2025
**Status:** Draft for Review

### Next Steps

1. **Review & Approve:** Stakeholder review of this plan
2. **Design Mockups:** Create Figma designs for key sections
3. **Content Writing:** Finalize all copy
4. **Development:** Begin Phase 1 tasks
5. **Testing:** Continuous testing throughout development
6. **Launch:** Go live and monitor metrics

### Questions to Resolve Before Development

- [ ] Do we have budget for custom illustrations or use stock photos?
- [ ] Do we want video explainer in MVP or Phase 2?
- [ ] Should we build email capture form now or later?
- [ ] Do we need legal review for Privacy Policy and Terms?
- [ ] What analytics tool should we use (Google Analytics, Plausible, etc.)?

---

**End of Landing Page Development Plan**
