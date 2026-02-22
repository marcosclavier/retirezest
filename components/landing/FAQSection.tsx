'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Can I plan for both myself and my spouse/partner?',
    answer: 'Yes! RetireZest fully supports both single and couples retirement planning. You can enter information for both partners, and our system will optimize strategies considering both incomes, coordinating CPP/OAS timing, and maximizing tax efficiency for your household.',
  },
  {
    question: 'Is Retire Zest really free?',
    answer: 'Yes! Retire Zest is currently free to use with full access to all features. We may introduce premium features in the future, but core retirement planning will remain free.',
  },
  {
    question: 'How accurate are the CPP and OAS calculations?',
    answer: 'Our calculators use official 2025-2026 government rates and formulas. While we provide accurate estimates, your actual benefits may vary based on your complete earnings history. We recommend verifying with Service Canada.',
  },
  {
    question: 'Is my financial data secure?',
    answer: 'Absolutely. We use bank-level 256-bit encryption, secure authentication, and never sell your data. Your information is stored securely and only accessible by you.',
  },
  {
    question: 'Do I need to provide bank account information?',
    answer: 'No. You manually enter your financial information (income, assets, expenses). We never ask for bank account numbers, passwords, or access to your accounts.',
  },
  {
    question: 'Can I use this if I\'m already retired?',
    answer: 'Yes! Retire Zest works for pre-retirees and current retirees. You can project your remaining retirement years and ensure your savings will last.',
  },
  {
    question: 'Which provinces are supported?',
    answer: 'Our tax calculator fully supports Alberta, British Columbia, Ontario, and Quebec. Users in other provinces are automatically mapped to the nearest supported province for tax calculations. CPP, OAS, and GIS calculations work for all Canadians.',
  },
  {
    question: 'Can I share my plan with my financial advisor?',
    answer: 'Yes! You can generate PDF reports to share with your advisor, spouse, or family members.',
  },
  {
    question: 'What if my situation changes?',
    answer: 'You can update your profile anytime and create multiple scenarios to compare different retirement plans.',
  },
  {
    question: 'Is this financial advice?',
    answer: 'No. Retire Zest is an educational planning tool. It does not provide personalized financial advice. Always consult a licensed financial advisor for specific recommendations.',
  },
  {
    question: 'How often are government rates updated?',
    answer: 'We update CPP, OAS, GIS, and tax rates annually when the government releases new figures (typically January).',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-20 bg-gray-50" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Everything you need to know about Retire Zest
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-5 pt-2">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Have more questions?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Contact our support team →
            </a>
            <span className="text-gray-400">or</span>
            <a
              href="mailto:contact@retirezest.com"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Email us directly
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
