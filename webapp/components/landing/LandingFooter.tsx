'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Image
                src="/retire-zest-logo.png"
                alt="Retire Zest"
                width={263}
                height={78}
                className="h-[53px] w-auto brightness-0 invert opacity-90"
              />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Canadian Retirement Planning Made Simple
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} Retire Zest. All rights reserved.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Pricing (Free)
                </Link>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.canada.ca/en/services/benefits/publicpensions/cpp.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  CPP Information
                </a>
              </li>
              <li>
                <a
                  href="https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  OAS Information
                </a>
              </li>
              <li>
                <a
                  href="https://www.canada.ca/en/revenue-agency.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  CRA Website
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@retirezest.ca"
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
              Built with ❤️ for Canadians | Last updated: December 2025 (2025-2026 tax rates)
            </p>

            <div className="flex gap-6">
              {/* Social Media Links - Placeholder for future */}
              {/* <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a> */}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong>Disclaimer:</strong> Retire Zest is an educational retirement planning tool and does not provide personalized financial, tax, or legal advice.
            The calculations and projections provided are estimates based on the information you provide and current government rates.
            Actual retirement benefits and tax obligations may vary. Always consult with a licensed financial advisor, tax professional,
            or legal expert for advice specific to your personal circumstances.
          </p>
        </div>

      </div>
    </footer>
  );
}
