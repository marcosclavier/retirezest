import { ProjectionSummary } from '@/lib/calculations/projection';

interface RetirementReportProps {
  userName: string;
  projection: ProjectionSummary;
  inputs: {
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    rrspBalance: number;
    tfsaBalance: number;
    nonRegBalance: number;
    annualExpenses: number;
    investmentReturnRate: number;
    inflationRate: number;
  };
}

export function RetirementReport({ userName, projection, inputs }: RetirementReportProps) {
  const today = new Date().toLocaleDateString();
  const totalAssets = inputs.rrspBalance + inputs.tfsaBalance + inputs.nonRegBalance;

  // Key milestones from projection
  const retirementYear = projection.projections.find((p) => p.isRetired);
  const rrifYear = projection.projections.find((p) => p.isRrifAge);
  const finalYear = projection.projections[projection.projections.length - 1];

  return (
    <div id="retirement-report" className="bg-white p-8 max-w-4xl mx-auto print:p-0">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Retirement Planning Report</h1>
        <p className="text-lg text-gray-600">Prepared for {userName}</p>
        <p className="text-sm text-gray-500">Generated on {today}</p>
      </div>

      {/* Executive Summary */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Executive Summary
        </h2>
        <div className="bg-blue-50 p-6 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Age</p>
              <p className="text-xl font-bold text-gray-900">{inputs.currentAge}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Target Retirement Age</p>
              <p className="text-xl font-bold text-gray-900">{inputs.retirementAge}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Years to Retirement</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.max(0, inputs.retirementAge - inputs.currentAge)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Planning Horizon</p>
              <p className="text-xl font-bold text-gray-900">
                {inputs.lifeExpectancy - inputs.currentAge} years
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Findings */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Key Findings
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-blue-600 mr-3 text-xl">•</span>
            <span className="text-gray-700">
              <strong>Retirement Income:</strong> Average annual retirement income of{' '}
              <strong>${projection.averageAnnualIncome.toLocaleString()}</strong>
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-3 text-xl">•</span>
            <span className="text-gray-700">
              <strong>Tax Burden:</strong> You will pay approximately{' '}
              <strong>${projection.totalTaxesPaid.toLocaleString()}</strong> in taxes over your
              retirement ({projection.averageAnnualTaxRate.toFixed(1)}% average rate)
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-3 text-xl">•</span>
            <span className="text-gray-700">
              <strong>Asset Status:</strong>{' '}
              {projection.assetsDepleted ? (
                <>
                  Your assets are projected to be depleted at age{' '}
                  <strong className="text-red-600">{projection.assetsDepletedAge}</strong>
                </>
              ) : (
                <>
                  You are projected to have <strong>${projection.remainingAssets.toLocaleString()}</strong>{' '}
                  remaining at age {inputs.lifeExpectancy}
                </>
              )}
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-3 text-xl">•</span>
            <span className="text-gray-700">
              <strong>Total Expenses:</strong> Projected lifetime expenses of{' '}
              <strong>${projection.totalExpenses.toLocaleString()}</strong>
            </span>
          </li>
        </ul>
      </section>

      {/* Current Financial Position */}
      <section className="mb-8 page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Current Financial Position
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Assets</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">RRSP:</span>
                <span className="font-semibold">${inputs.rrspBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TFSA:</span>
                <span className="font-semibold">${inputs.tfsaBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Non-Registered:</span>
                <span className="font-semibold">${inputs.nonRegBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-900 font-bold">Total Assets:</span>
                <span className="font-bold text-blue-600">${totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Planning Assumptions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Expenses:</span>
                <span className="font-semibold">${inputs.annualExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Investment Return:</span>
                <span className="font-semibold">{(inputs.investmentReturnRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inflation Rate:</span>
                <span className="font-semibold">{(inputs.inflationRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Retirement Milestones */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Key Retirement Milestones
        </h2>
        <div className="space-y-4">
          {retirementYear && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Age {retirementYear.age}: Retirement Begins
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Income</p>
                  <p className="font-semibold">${retirementYear.totalGrossIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expenses</p>
                  <p className="font-semibold">${retirementYear.annualExpenses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Assets</p>
                  <p className="font-semibold">${retirementYear.totalAssets.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {rrifYear && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Age {rrifYear.age}: RRIF Conversion
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">RRIF Balance</p>
                  <p className="font-semibold">${rrifYear.rrspBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Min. Withdrawal</p>
                  <p className="font-semibold">${rrifYear.rrifMinWithdrawal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Assets</p>
                  <p className="font-semibold">${rrifYear.totalAssets.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Age {finalYear.age}: End of Planning Period
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Income</p>
                <p className="font-semibold">${finalYear.totalGrossIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Expenses</p>
                <p className="font-semibold">${finalYear.annualExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Remaining Assets</p>
                <p className={`font-semibold ${finalYear.totalAssets > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${finalYear.totalAssets.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Year-by-Year Summary (Key Years Only) */}
      <section className="mb-8 page-break">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
          Year-by-Year Summary (Key Years)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Age</th>
                <th className="px-4 py-2 text-right">Income</th>
                <th className="px-4 py-2 text-right">Taxes</th>
                <th className="px-4 py-2 text-right">Expenses</th>
                <th className="px-4 py-2 text-right">Assets</th>
              </tr>
            </thead>
            <tbody>
              {projection.projections
                .filter((p, i) => i % 5 === 0 || p.isRetired === projection.projections[i - 1]?.isRetired || p.isRrifAge)
                .slice(0, 15)
                .map((year) => (
                  <tr key={year.age} className="border-b">
                    <td className="px-4 py-2">{year.age}</td>
                    <td className="px-4 py-2 text-right">${year.totalGrossIncome.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">${year.totalTax.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">${year.annualExpenses.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      ${year.totalAssets.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Important Disclaimers */}
      <section className="mb-8 border-t-2 border-gray-300 pt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Important Disclaimers</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 space-y-2 text-sm text-gray-700">
          <p>
            <strong>Not Financial Advice:</strong> This report is for informational purposes only and
            does not constitute professional financial, investment, or tax advice.
          </p>
          <p>
            <strong>Estimates Only:</strong> All projections are estimates based on the assumptions
            provided. Actual results may vary significantly due to market conditions, tax law changes,
            and personal circumstances.
          </p>
          <p>
            <strong>Consult a Professional:</strong> Before making any financial decisions, please
            consult with a Certified Financial Planner (CFP) or qualified financial advisor.
          </p>
          <p>
            <strong>Government Benefits:</strong> CPP, OAS, and GIS amounts are estimates based on
            current 2025 rates and may change. Verify amounts with Service Canada.
          </p>
          <p>
            <strong>Tax Calculations:</strong> Tax calculations are approximate and may not reflect
            all credits, deductions, or provincial variations. Consult a tax professional.
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Generated by Canadian Retirement Planning App • {today}
          </p>
        </div>
      </section>
    </div>
  );
}
