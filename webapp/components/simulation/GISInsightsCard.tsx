'use client';

import { StrategyInsights } from '@/lib/types/simulation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Lightbulb,
  Target,
  Info
} from 'lucide-react';

interface GISInsightsCardProps {
  insights: StrategyInsights;
}

export function GISInsightsCard({ insights }: GISInsightsCardProps) {
  const {
    gis_feasibility,
    strategy_effectiveness,
    main_message,
    gis_eligibility_summary,
    gis_eligibility_explanation,
    recommendations,
    optimization_opportunities,
    key_milestones,
    summary_metrics
  } = insights;

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'limited': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'not_eligible': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get effectiveness color
  const getEffectivenessColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get milestone icon
  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'active': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'upcoming': return <Calendar className="h-5 w-5 text-orange-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Strategy Assessment */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">GIS Strategy Assessment</CardTitle>
              <CardDescription className="mt-2 text-gray-700">
                AI-powered analysis for your Minimize Income strategy
              </CardDescription>
            </div>
            <Badge className={`${getEffectivenessColor(strategy_effectiveness.level)} text-sm font-semibold px-4 py-2`}>
              {strategy_effectiveness.level} ({strategy_effectiveness.rating}/10)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Message */}
          <Alert className={`${getStatusColor(gis_feasibility.status)} border-2`}>
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold text-gray-900">{main_message}</AlertTitle>
            <AlertDescription className="mt-2 text-base text-gray-800">
              {gis_eligibility_summary}
            </AlertDescription>
          </Alert>

          {/* GIS Eligibility Details */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              GIS Eligibility Analysis
            </h3>
            <p className="text-blue-800 leading-relaxed">{gis_eligibility_explanation}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600">Total GIS Benefits</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(summary_metrics.total_gis)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600">Eligible Years</div>
                <div className="text-2xl font-bold text-blue-900">
                  {summary_metrics.years_with_gis}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600">RRIF Balance</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(gis_feasibility.combined_rrif)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600">Max RRIF @ 71</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(gis_feasibility.max_rrif_for_gis_at_71)}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Effectiveness Reasons */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Why this Rating?</h3>
            <ul className="space-y-2">
              {strategy_effectiveness.reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="mt-1">{reason.includes('✓') ? '✓' : reason.includes('⚠️') ? '⚠️' : '❌'}</span>
                  <span>{reason.replace(/^[✓⚠️❌]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription className="text-gray-700">Action items to optimize your retirement plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getPriorityIcon(rec.priority)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{rec.description}</p>
                    <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-900">Action:</div>
                      <p className="text-sm text-gray-700">{rec.action}</p>
                      <div className="text-sm font-medium text-green-700 mt-2">
                        Expected Benefit: {rec.expected_benefit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optimization Opportunities */}
      {optimization_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Target className="h-5 w-5 text-orange-600" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription className="text-gray-700">Additional improvements identified from your simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {optimization_opportunities.map((opp, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-800">{opp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Milestones Timeline */}
      {key_milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-5 w-5 text-purple-600" />
              Key Milestones
            </CardTitle>
            <CardDescription className="text-gray-700">Important ages and events in your retirement plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {key_milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {getMilestoneIcon(milestone.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                        Age {milestone.age}
                      </span>
                      <h4 className="font-semibold text-gray-900">{milestone.event}</h4>
                    </div>
                    <p className="text-gray-700 text-sm mt-2">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
