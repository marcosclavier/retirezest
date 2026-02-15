"""
Metrics Tracking Module - Historical Plan Assessment Tracking

Tracks reliability metrics over time to show:
- How plan health has changed with market conditions
- Impact of adjustments made between simulations
- Trend analysis and forecasting
- Progress toward gap closure
- Risk management and alerts

Enables users to understand their plan's evolution and track progress.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict


@dataclass
class MetricsSnapshot:
    """Snapshot of plan metrics at a point in time."""
    timestamp: str
    scenario_name: str
    success_rate: float
    years_funded: int
    longevity_gap: int
    final_net_worth: float
    depleted_age_p1: Optional[int]
    depleted_age_p2: Optional[int]
    adjustments_applied: Dict = None
    market_assumption: str = "baseline"
    notes: str = ""


class MetricsTracker:
    """
    Track and analyze reliability metrics over time.

    Enables monitoring of:
    - Plan health trends
    - Impact of adjustments
    - Market condition effects
    - Progress toward goals
    """

    def __init__(self):
        """Initialize metrics tracker with empty history."""
        self.snapshots: List[MetricsSnapshot] = []

    def record_snapshot(
        self,
        scenario_name: str,
        success_rate: float,
        years_funded: int,
        longevity_gap: int,
        final_net_worth: float,
        depleted_age_p1: Optional[int] = None,
        depleted_age_p2: Optional[int] = None,
        adjustments_applied: Dict = None,
        market_assumption: str = "baseline",
        notes: str = ""
    ):
        """
        Record a snapshot of plan metrics.

        Args:
            scenario_name: Name of the scenario (e.g., "Baseline", "Work 5 Years")
            success_rate: Success rate percentage (0-100)
            years_funded: Years portfolio funds
            longevity_gap: Gap in years from planning horizon
            final_net_worth: Final net worth at end of plan
            depleted_age_p1: Age when P1's portfolio depletes
            depleted_age_p2: Age when P2's portfolio depletes
            adjustments_applied: Dict of adjustments made (optional)
            market_assumption: Market condition assumption ("baseline", "good", "poor")
            notes: Additional notes about this snapshot
        """
        snapshot = MetricsSnapshot(
            timestamp=datetime.now().isoformat(),
            scenario_name=scenario_name,
            success_rate=success_rate,
            years_funded=years_funded,
            longevity_gap=longevity_gap,
            final_net_worth=final_net_worth,
            depleted_age_p1=depleted_age_p1,
            depleted_age_p2=depleted_age_p2,
            adjustments_applied=adjustments_applied or {},
            market_assumption=market_assumption,
            notes=notes
        )

        self.snapshots.append(snapshot)

    def get_history(self, scenario_name: Optional[str] = None) -> pd.DataFrame:
        """
        Get history of metrics as DataFrame.

        Args:
            scenario_name: Filter to specific scenario (optional)

        Returns:
            DataFrame with historical metrics
        """
        if not self.snapshots:
            return pd.DataFrame()

        # Convert snapshots to records
        records = [asdict(s) for s in self.snapshots]

        # Filter by scenario if specified
        if scenario_name:
            records = [r for r in records if r['scenario_name'] == scenario_name]

        df = pd.DataFrame(records)

        # Parse timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])

        return df.sort_values('timestamp')

    def get_latest_snapshot(self, scenario_name: Optional[str] = None) -> Optional[MetricsSnapshot]:
        """
        Get most recent snapshot.

        Args:
            scenario_name: Filter to specific scenario (optional)

        Returns:
            Most recent MetricsSnapshot or None
        """
        if not self.snapshots:
            return None

        filtered = self.snapshots
        if scenario_name:
            filtered = [s for s in filtered if s.scenario_name == scenario_name]

        if not filtered:
            return None

        return filtered[-1]

    def calculate_trend(self, metric: str, scenario_name: Optional[str] = None) -> Dict:
        """
        Calculate trend for a specific metric.

        Args:
            metric: Metric name ("success_rate", "longevity_gap", "years_funded", "final_net_worth")
            scenario_name: Filter to specific scenario (optional)

        Returns:
            Dictionary with trend analysis
        """
        df = self.get_history(scenario_name)

        if df.empty or len(df) < 2:
            return {'status': 'insufficient_data', 'message': 'Need at least 2 data points'}

        values = df[metric].values
        times = df['timestamp'].values

        # Calculate change
        first_value = values[0]
        last_value = values[-1]
        total_change = last_value - first_value
        pct_change = (total_change / max(abs(first_value), 1)) * 100 if first_value != 0 else 0

        # Calculate trend direction
        if len(values) >= 3:
            # Simple linear regression for trend
            x = np.arange(len(values))
            slope = np.polyfit(x, values, 1)[0]
            trend = 'improving' if slope < 0 else 'stable' if abs(slope) < 0.1 else 'declining'
        else:
            trend = 'improving' if total_change < 0 else 'stable' if total_change == 0 else 'declining'

        return {
            'metric': metric,
            'current_value': last_value,
            'previous_value': first_value,
            'total_change': total_change,
            'pct_change': pct_change,
            'trend': trend,
            'observations': len(values),
            'first_recorded': df['timestamp'].iloc[0].isoformat(),
            'last_recorded': df['timestamp'].iloc[-1].isoformat()
        }

    def compare_scenarios(self) -> pd.DataFrame:
        """
        Compare metrics across all scenarios in latest snapshots.

        Returns:
            DataFrame with latest metrics for each scenario
        """
        if not self.snapshots:
            return pd.DataFrame()

        # Get latest snapshot for each scenario
        scenarios = {}
        for snapshot in self.snapshots:
            scenarios[snapshot.scenario_name] = snapshot

        # Convert to records
        records = [asdict(s) for s in scenarios.values()]

        df = pd.DataFrame(records)
        df = df.sort_values('longevity_gap')  # Sort by gap (ascending = best)

        return df

    def get_alerts(self) -> List[Dict]:
        """
        Generate alerts based on metric trends and thresholds.

        Returns:
            List of alert dictionaries with message and severity
        """
        alerts = []

        latest = self.get_latest_snapshot()
        if not latest:
            return alerts

        # Alert: High success rate threshold not met
        if latest.success_rate < 60:
            alerts.append({
                'severity': 'critical',
                'message': f"Success rate {latest.success_rate:.0f}% is below 60% threshold. "
                          f"Major adjustments recommended.",
                'metric': 'success_rate',
                'value': latest.success_rate
            })
        elif latest.success_rate < 75:
            alerts.append({
                'severity': 'warning',
                'message': f"Success rate {latest.success_rate:.0f}% is below 75% benchmark. "
                          f"Consider adjustments to improve reliability.",
                'metric': 'success_rate',
                'value': latest.success_rate
            })

        # Alert: Longevity gap threshold
        if latest.longevity_gap > 7:
            alerts.append({
                'severity': 'critical',
                'message': f"Longevity gap of {latest.longevity_gap} years is critical. "
                          f"Immediate action required to close this gap.",
                'metric': 'longevity_gap',
                'value': latest.longevity_gap
            })
        elif latest.longevity_gap > 3:
            alerts.append({
                'severity': 'warning',
                'message': f"Longevity gap of {latest.longevity_gap} years needs attention. "
                          f"Plan adjustments would improve sustainability.",
                'metric': 'longevity_gap',
                'value': latest.longevity_gap
            })

        # Alert: Worsening trend
        gap_trend = self.calculate_trend('longevity_gap')
        if gap_trend.get('trend') == 'declining' and gap_trend.get('total_change', 0) > 0:
            alerts.append({
                'severity': 'warning',
                'message': f"Longevity gap is worsening. "
                          f"Changed by {gap_trend['total_change']:+.1f} years over tracking period.",
                'metric': 'trend_longevity_gap',
                'value': gap_trend['total_change']
            })

        success_trend = self.calculate_trend('success_rate')
        if success_trend.get('trend') == 'declining' and success_trend.get('total_change', 0) < -5:
            alerts.append({
                'severity': 'warning',
                'message': f"Success rate declining. "
                          f"Changed by {success_trend['total_change']:+.0f}% over tracking period.",
                'metric': 'trend_success_rate',
                'value': success_trend['total_change']
            })

        # Alert: Portfolio depletion in near term
        if latest.depleted_age_p1 and latest.depleted_age_p1 < 85:
            alerts.append({
                'severity': 'critical',
                'message': f"Portfolio depletes before age 85. "
                          f"P1 would run out of funds at age {latest.depleted_age_p1}.",
                'metric': 'depletion_age_p1',
                'value': latest.depleted_age_p1
            })

        return alerts

    def export_history(self, filename: str = None) -> str:
        """
        Export tracking history to CSV.

        Args:
            filename: Output filename (default: metrics_history_YYYY-MM-DD.csv)

        Returns:
            Path to exported file
        """
        if not self.snapshots:
            raise ValueError("No snapshots to export")

        if filename is None:
            today = datetime.now().strftime("%Y-%m-%d")
            filename = f"metrics_history_{today}.csv"

        df = self.get_history()

        # Flatten adjustments_applied dict to columns
        if 'adjustments_applied' in df.columns:
            adjustments = df['adjustments_applied'].apply(
                lambda x: pd.Series(x) if x else pd.Series()
            )
            df = pd.concat([df, adjustments], axis=1)
            df = df.drop('adjustments_applied', axis=1)

        df.to_csv(filename, index=False)

        return filename

    def get_summary_report(self) -> Dict:
        """
        Generate summary report of tracked metrics.

        Returns:
            Dictionary with summary statistics
        """
        if not self.snapshots:
            return {'status': 'no_data', 'message': 'No tracking data available'}

        latest = self.get_latest_snapshot()
        baseline = self.snapshots[0]

        # Get all scenarios
        scenarios = {}
        for snapshot in self.snapshots:
            if snapshot.scenario_name not in scenarios:
                scenarios[snapshot.scenario_name] = []
            scenarios[snapshot.scenario_name].append(snapshot)

        # Calculate improvements
        improvements = {}
        if len(scenarios) > 1 and 'Baseline' in scenarios:
            baseline_latest = scenarios['Baseline'][-1]

            for scenario_name, snapshots_list in scenarios.items():
                if scenario_name != 'Baseline':
                    latest_scenario = snapshots_list[-1]

                    improvements[scenario_name] = {
                        'success_rate_change': latest_scenario.success_rate - baseline_latest.success_rate,
                        'gap_improvement': baseline_latest.longevity_gap - latest_scenario.longevity_gap,
                        'years_extension': latest_scenario.years_funded - baseline_latest.years_funded,
                    }

        return {
            'status': 'success',
            'tracking_period': {
                'start': baseline.timestamp,
                'end': latest.timestamp,
                'snapshots': len(self.snapshots)
            },
            'current_state': asdict(latest),
            'baseline_state': asdict(baseline),
            'total_improvement': {
                'gap_closed': baseline.longevity_gap - latest.longevity_gap,
                'success_rate_gain': latest.success_rate - baseline.success_rate,
                'years_extended': latest.years_funded - baseline.years_funded,
            },
            'alerts': self.get_alerts(),
            'scenario_improvements': improvements,
            'unique_scenarios': list(scenarios.keys())
        }


def create_metrics_tracker() -> MetricsTracker:
    """Factory function to create a metrics tracker."""
    return MetricsTracker()
