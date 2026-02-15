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
  Info,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

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
    summary_metrics,
    disclaimer,
    last_updated,
    data_sources
  } = insights;

  // State for collapsible sections
  const [expandedCaveats, setExpandedCaveats] = useState<{ [key: number]: boolean }>({});

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

  // Get confidence color
  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get feasibility color and icon
  const getFeasibilityDisplay = (feasibility?: string) => {
    switch (feasibility) {
      case 'confirmed':
        return {
          color: 'bg-green-50 border-green-200 text-green-800',
          icon: <ShieldCheck className="h-4 w-4 text-green-600" />,
          label: 'Feasible'
        };
      case 'limited':
        return {
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <ShieldAlert className="h-4 w-4 text-yellow-600" />,
          label: 'Limited Feasibility'
        };
      case 'uncertain':
        return {
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
          label: 'Uncertain'
        };
      default:
        return null;
    }
  };

  // Toggle caveats expansion
  const toggleCaveats = (index: number) => {
    setExpandedCaveats(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
                  <div className="flex-1 space-y-3">
                    {/* Header with badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                      {rec.confidence && (
                        <Badge variant="outline" className={`text-xs border ${getConfidenceColor(rec.confidence)}`}>
                          {rec.confidence.toUpperCase()} CONFIDENCE
                        </Badge>
                      )}
                      {rec.feasibility && getFeasibilityDisplay(rec.feasibility) && (
                        <Badge variant="outline" className={`text-xs border flex items-center gap-1 ${getFeasibilityDisplay(rec.feasibility)?.color}`}>
                          {getFeasibilityDisplay(rec.feasibility)?.icon}
                          {getFeasibilityDisplay(rec.feasibility)?.label}
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-700">{rec.description}</p>

                    {/* Feasibility Note */}
                    {rec.feasibility_note && (
                      <Alert className={`${getFeasibilityDisplay(rec.feasibility)?.color || 'bg-blue-50 border-blue-200'} text-sm`}>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-gray-800">
                          <strong>Feasibility:</strong> {rec.feasibility_note}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Timing Note */}
                    {rec.timing_note && (
                      <Alert className={`${rec.timing_appropriateness ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} text-sm`}>
                        <Calendar className="h-4 w-4" />
                        <AlertDescription className="text-gray-800">
                          <strong>Timing:</strong> {rec.timing_note}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Box */}
                    <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="text-sm font-medium text-gray-900">Action:</div>
                      <p className="text-sm text-gray-700">{rec.action}</p>

                      {/* Benefit Display with Range */}
                      <div className="mt-3 space-y-1">
                        <div className="text-sm font-medium text-green-700">
                          Expected Benefit: {rec.expected_benefit}
                        </div>
                        {rec.benefit_range && (
                          <div className="text-xs text-gray-600 mt-1">
                            Range: {formatCurrency(rec.benefit_range.lower)} - {formatCurrency(rec.benefit_range.upper)}
                            {' '}(estimate: {formatCurrency(rec.benefit_range.estimate)})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assumptions */}
                    {rec.assumptions && rec.assumptions.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Key Assumptions:</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.assumptions.map((assumption, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-gray-400">•</span>
                              <span>{assumption}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Collapsible Caveats */}
                    {rec.caveats && rec.caveats.length > 0 && (
                      <div className="border border-orange-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCaveats(index)}
                          className="w-full flex items-center justify-between bg-orange-50 hover:bg-orange-100 px-3 py-2 text-sm transition-colors"
                        >
                          <span className="font-semibold text-orange-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Important Caveats ({rec.caveats.length})
                          </span>
                          {expandedCaveats[index] ? (
                            <ChevronUp className="h-4 w-4 text-orange-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-orange-600" />
                          )}
                        </button>
                        {expandedCaveats[index] && (
                          <div className="bg-white p-3 border-t border-orange-200">
                            <ul className="text-xs text-gray-700 space-y-2">
                              {rec.caveats.map((caveat, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">⚠</span>
                                  <span>{caveat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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

      {/* General Disclaimer */}
      {disclaimer && (
        <Alert className="bg-amber-50 border-2 border-amber-300">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 font-semibold">Important Disclaimer</AlertTitle>
          <AlertDescription className="text-amber-800 text-sm mt-2 leading-relaxed">
            {disclaimer}
          </AlertDescription>
          {(last_updated || data_sources) && (
            <div className="mt-4 pt-4 border-t border-amber-300">
              {last_updated && (
                <p className="text-xs text-amber-700">
                  <strong>Last Updated:</strong> {last_updated}
                </p>
              )}
              {data_sources && data_sources.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-700 font-semibold mb-1">Data Sources:</p>
                  <ul className="text-xs text-amber-700 space-y-0.5">
                    {data_sources.map((source, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Alert>
      )}
    </div>
  );
}
