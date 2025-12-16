import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateProfileCompletion, getCompletionLevel, getNextAction } from '@/lib/utils/profileCompletion';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null; // Will be redirected by layout
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      incomeSources: true,
      assets: true,
      expenses: true,
      debts: true,
    },
    // Note: include already brings all user fields, including the new ones:
    // targetRetirementAge, lifeExpectancy, cppCalculatorUsedAt, oasCalculatorUsedAt
  });

  // Calculate total assets
  const totalAssets = user?.assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;

  // Calculate total debts
  const totalDebts = user?.debts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0) || 0;

  // Calculate net worth
  const netWorth = totalAssets - totalDebts;

  // Calculate annual income
  const annualIncome = user?.incomeSources.reduce((sum, income) => {
    const multiplier = income.frequency === 'monthly' ? 12 : 1;
    return sum + (income.amount * multiplier);
  }, 0) || 0;

  // Calculate monthly expenses
  const monthlyExpenses = user?.expenses.reduce((sum, expense) => {
    const multiplier = expense.frequency === 'monthly' ? 1 : 1/12;
    return sum + (expense.amount * multiplier);
  }, 0) || 0;

  // Calculate profile completion
  const completion = calculateProfileCompletion({
    firstName: user?.firstName || null,
    lastName: user?.lastName || null,
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    province: user?.province || null,
    maritalStatus: user?.maritalStatus || null,
    incomeCount: user?.incomeSources.length || 0,
    assetCount: user?.assets.length || 0,
    expenseCount: user?.expenses.length || 0,
    hasRetirementAge: !!user?.targetRetirementAge,
    hasLifeExpectancy: !!user?.lifeExpectancy,
    hasUsedCPPCalculator: !!user?.cppCalculatorUsedAt,
    hasUsedOASCalculator: !!user?.oasCalculatorUsedAt,
  });

  const completionLevel = getCompletionLevel(completion.percentage);
  const nextAction = getNextAction(completion.missingSections);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your retirement planning progress
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Net Worth */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Net Worth</h3>
            <div className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${netWorth.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Assets: ${totalAssets.toLocaleString()} | Debts: ${totalDebts.toLocaleString()}
          </p>
        </div>

        {/* Annual Income */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Annual Income</h3>
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${annualIncome.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.incomeSources.length || 0} income source(s)
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Monthly Expenses</h3>
            <div className="text-orange-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {user?.expenses.length || 0} expense(s) tracked
          </p>
        </div>

        {/* Profile Completeness */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Profile Status</h3>
            <div className={`text-${completionLevel.color}-600`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {completion.percentage}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {completionLevel.label}
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-${completionLevel.color}-600 h-2 rounded-full transition-all`}
              style={{ width: `${completion.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/profile"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-600">Add income, assets, and expenses</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </a>

          <a
            href="/benefits"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Calculate Benefits</h3>
              <p className="text-sm text-gray-600">Estimate CPP, OAS, and GIS</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </a>

          <a
            href="/scenarios"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">View Projection</h3>
              <p className="text-sm text-gray-600">See your retirement outlook</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>

      {/* Next Steps - Dynamic based on profile completion */}
      {completion.percentage < 100 && completion.missingSections.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">
                {completion.percentage === 0 ? '👋 Welcome! Let\'s get started' : '📋 Next Steps'}
              </h2>
              <p className="text-blue-700 text-sm">
                Complete {completion.missingSections.length} more {completion.missingSections.length === 1 ? 'section' : 'sections'} to get accurate retirement projections
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-900">{completion.percentage}%</span>
          </div>

          <div className="space-y-3">
            {completion.missingSections.slice(0, 3).map((section, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                  {section.link && (
                    <Link
                      href={section.link}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      {section.action || 'Complete'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {completion.missingSections.length > 3 && (
            <p className="text-xs text-blue-700 mt-3 text-center">
              +{completion.missingSections.length - 3} more {completion.missingSections.length - 3 === 1 ? 'section' : 'sections'} to complete
            </p>
          )}
        </div>
      )}

      {/* Success Message when profile is complete */}
      {completion.percentage === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">Profile Complete!</h2>
              <p className="text-green-700 text-sm">
                Your profile is fully set up. View your retirement projection to see your personalized plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
