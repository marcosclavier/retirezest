"""
Retirement Planning Projection Graphs

Creates Plotly figures for retirement planning visualizations:
- Tier 1: Spending Coverage, Account Depletion, Government Benefits
- Tier 2: Plan Funding %, Marginal Tax Rate, Income Composition
"""

import plotly.graph_objects as go
import pandas as pd
import numpy as np


def create_spending_coverage_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Spending Coverage Year-by-Year graph (Tier 1).

    Shows annual income as % of spending target:
    - 100% = exactly funded
    - >100% = surplus
    - <100% = underfunded

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    # Ensure required columns exist
    required_cols = ['year', 'spend_target_after_tax']
    for col in required_cols:
        if col not in df.columns:
            df[col] = 0.0

    # Calculate total annual income from all sources
    df_work = df.copy()

    # Withdrawals from accounts
    withdraw_cols = ['withdraw_nonreg_p1', 'withdraw_nonreg_p2',
                    'withdraw_rrif_p1', 'withdraw_rrif_p2',
                    'withdraw_tfsa_p1', 'withdraw_tfsa_p2',
                    'withdraw_corp_p1', 'withdraw_corp_p2']
    for col in withdraw_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Government benefits
    benefit_cols = ['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2', 'gis_p1', 'gis_p2']
    for col in benefit_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Non-registered distributions
    nr_cols = ['nr_interest_p1', 'nr_interest_p2', 'nr_elig_div_p1', 'nr_elig_div_p2',
               'nr_nonelig_div_p1', 'nr_nonelig_div_p2', 'nr_capg_dist_p1', 'nr_capg_dist_p2']
    for col in nr_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Calculate total income
    df_work['total_income'] = (
        df_work[withdraw_cols].sum(axis=1) +
        df_work[benefit_cols].sum(axis=1) +
        df_work[nr_cols].sum(axis=1)
    )

    # Calculate coverage %
    df_work['coverage_pct'] = (df_work['total_income'] / df_work['spend_target_after_tax'].clip(lower=1.0)) * 100

    # Create figure
    fig = go.Figure()

    # Add line for coverage %
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['coverage_pct'],
        mode='lines+markers',
        name='Spending Coverage %',
        line=dict(color='#1976D2', width=3),
        marker=dict(size=6),
        hovertemplate='<b>Year %{x}</b><br>Coverage: %{y:.1f}%<extra></extra>'
    ))

    # Add 100% reference line
    fig.add_hline(y=100, line_dash='dash', line_color='#D32F2F',
                 annotation_text='100% (Fully Funded)',
                 annotation_position='right')

    # Color regions: above and below 100%
    fig.add_hrect(y0=100, y1=df_work['coverage_pct'].max() * 1.1,
                 fillcolor='#E8F5E9', opacity=0.2, layer='below',
                 annotation_text='Surplus', annotation_position='right top')

    fig.add_hrect(y0=0, y1=100,
                 fillcolor='#FFEBEE', opacity=0.2, layer='below',
                 annotation_text='Underfunded', annotation_position='right bottom')

    fig.update_layout(
        title='Spending Coverage Year-by-Year',
        xaxis_title='Year',
        yaxis_title='Annual Income / Spending Target (%)',
        height=400,
        hovermode='x unified',
        template='plotly_white'
    )

    return fig


def create_account_depletion_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Account Depletion Timeline graph (Tier 1).

    Shows balance trajectory for each account type over time.
    Critical for understanding tax sequencing and plan sustainability.

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    account_cols = {
        'RRIF': ['end_rrif_p1', 'end_rrif_p2'],
        'TFSA': ['end_tfsa_p1', 'end_tfsa_p2'],
        'Non-Registered': ['end_nonreg_p1', 'end_nonreg_p2'],
        'RRSP': ['end_rrsp_p1', 'end_rrsp_p2'],
        'Corporate': ['end_corp_p1', 'end_corp_p2']
    }

    for account_type, cols in account_cols.items():
        for col in cols:
            if col not in df_work.columns:
                df_work[col] = 0.0

    # Create figure
    fig = go.Figure()

    # Define colors for each account type
    colors = {
        'RRIF': '#1976D2',
        'TFSA': '#388E3C',
        'Non-Registered': '#F57C00',
        'RRSP': '#7B1FA2',
        'Corporate': '#C2185B'
    }

    # Add trace for each account type
    for account_type, cols in account_cols.items():
        df_work[account_type] = df_work[cols].sum(axis=1)

        fig.add_trace(go.Scatter(
            x=df_work['year'],
            y=df_work[account_type],
            mode='lines',
            name=account_type,
            line=dict(color=colors[account_type], width=2),
            stackgroup=None,  # Don't stack - show individual lines
            hovertemplate='<b>%{fullData.name}</b><br>Year %{x}<br>Balance: $%{y:,.0f}<extra></extra>'
        ))

    # Add zero line reference
    fig.add_hline(y=0, line_dash='dash', line_color='#666666', opacity=0.5)

    fig.update_layout(
        title='Account Balance Depletion Timeline',
        xaxis_title='Year',
        yaxis_title='Account Balance ($)',
        height=400,
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(tickformat='$,.0f')
    )

    return fig


def create_gov_benefits_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Government Benefits Over Time graph (Tier 1).

    Shows annual CPP, OAS, and GIS payments stacked.
    Government benefits typically fund 30-40% of retirement.

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    benefit_cols = ['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2', 'gis_p1', 'gis_p2']
    for col in benefit_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Aggregate benefits
    df_work['CPP'] = df_work['cpp_p1'] + df_work['cpp_p2']
    df_work['OAS'] = df_work['oas_p1'] + df_work['oas_p2']
    df_work['GIS'] = df_work['gis_p1'] + df_work['gis_p2']

    # Create figure
    fig = go.Figure()

    # Define colors
    colors = {'CPP': '#1976D2', 'OAS': '#388E3C', 'GIS': '#F57C00'}

    # Add stacked area chart
    for benefit in ['CPP', 'OAS', 'GIS']:
        fig.add_trace(go.Scatter(
            x=df_work['year'],
            y=df_work[benefit],
            mode='lines',
            name=benefit,
            line=dict(width=0.5, color=colors[benefit]),
            fillcolor=colors[benefit],
            stackgroup='one',
            hovertemplate='<b>%{fullData.name}</b><br>Year %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
        ))

    fig.update_layout(
        title='Government Benefits Over Time (CPP, OAS, GIS)',
        xaxis_title='Year',
        yaxis_title='Annual Benefits ($)',
        height=400,
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(tickformat='$,.0f')
    )

    return fig


def create_plan_funding_pct_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Plan Funding Percentage graph (Tier 2).

    Shows what % of retirement period is still fully funded.
    Visualizes when funding risk increases.

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    if 'underfunded_after_tax' not in df_work.columns:
        if 'net_worth_end' in df_work.columns:
            df_work['underfunded_after_tax'] = df_work['net_worth_end'] <= 0
        else:
            df_work['underfunded_after_tax'] = False

    # Calculate cumulative funding status
    total_years = len(df_work)
    df_work['years_funded'] = (df_work['underfunded_after_tax'] == False).cumsum()
    df_work['funding_pct'] = (df_work['years_funded'] / total_years) * 100

    # Create figure
    fig = go.Figure()

    # Add funding % line
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['funding_pct'],
        mode='lines+markers',
        name='Funding %',
        line=dict(color='#1976D2', width=3),
        marker=dict(size=6),
        fill='tozeroy',
        fillcolor='rgba(25, 118, 210, 0.2)',
        hovertemplate='<b>Year %{x}</b><br>Funded: %{y:.1f}%<extra></extra>'
    ))

    # Add reference lines
    fig.add_hline(y=100, line_dash='dash', line_color='#388E3C',
                 annotation_text='100% Funded', annotation_position='right')
    fig.add_hline(y=80, line_dash='dot', line_color='#F57C00',
                 annotation_text='80% (Good)', annotation_position='right')

    fig.update_layout(
        title='Plan Funding Percentage by Year',
        xaxis_title='Year',
        yaxis_title='% of Plan Period Still Funded',
        height=400,
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(range=[0, 105])
    )

    return fig


def create_marginal_tax_rate_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Marginal Tax Rate Progression graph (Tier 2).

    Shows estimated marginal tax rate by year.
    Validates tax efficiency of withdrawal strategy.

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    if 'total_tax_after_split' not in df_work.columns:
        df_work['total_tax_after_split'] = 0.0

    # Calculate taxable income (approximation)
    # Taxable income = withdrawals + benefits + distributions (rough estimate)
    withdraw_cols = ['withdraw_nonreg_p1', 'withdraw_nonreg_p2',
                    'withdraw_rrif_p1', 'withdraw_rrif_p2',
                    'withdraw_tfsa_p1', 'withdraw_tfsa_p2',  # Not actually taxable, but included in income
                    'withdraw_corp_p1', 'withdraw_corp_p2']
    benefit_cols = ['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2']  # Not all of OAS is taxable

    for col in withdraw_cols + benefit_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Approximate taxable income
    df_work['approx_taxable_income'] = df_work[withdraw_cols + benefit_cols].sum(axis=1)

    # Flatten tax column if needed
    def flatten_if_needed(val):
        try:
            if hasattr(val, '__iter__') and not isinstance(val, (str, bytes)):
                return float(sum(val))
            else:
                return float(val)
        except (TypeError, ValueError):
            return 0.0

    df_work['tax_clean'] = df_work['total_tax_after_split'].apply(flatten_if_needed)

    # Calculate effective marginal rate
    df_work['effective_rate'] = (
        (df_work['tax_clean'] / df_work['approx_taxable_income'].clip(lower=1)) * 100
    ).clip(0, 100)

    # Create figure
    fig = go.Figure()

    # Add line for effective rate
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['effective_rate'],
        mode='lines+markers',
        name='Effective Tax Rate',
        line=dict(color='#D32F2F', width=3),
        marker=dict(size=6),
        hovertemplate='<b>Year %{x}</b><br>Rate: %{y:.1f}%<extra></extra>'
    ))

    # Add reference zones
    fig.add_hrect(y0=0, y1=25, fillcolor='#E8F5E9', opacity=0.2, layer='below',
                 annotation_text='Low (<25%)', annotation_position='right bottom')
    fig.add_hrect(y0=25, y1=50, fillcolor='#FFF8E1', opacity=0.2, layer='below',
                 annotation_text='Moderate (25-50%)', annotation_position='right')
    fig.add_hrect(y0=50, y1=100, fillcolor='#FFEBEE', opacity=0.2, layer='below',
                 annotation_text='High (>50%)', annotation_position='right top')

    fig.update_layout(
        title='Marginal Tax Rate Progression Over Time',
        xaxis_title='Year',
        yaxis_title='Effective Tax Rate (%)',
        height=400,
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(range=[0, 100])
    )

    return fig


def create_income_composition_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Income Composition (Taxable vs Tax-Free) graph (Tier 2).

    Shows breakdown of annual income sources:
    - RRIF/RRSP (fully taxable)
    - TFSA (tax-free)
    - Non-Registered (partially taxable)
    - Government benefits

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    withdraw_cols = {
        'RRIF': ['withdraw_rrif_p1', 'withdraw_rrif_p2'],
        'TFSA': ['withdraw_tfsa_p1', 'withdraw_tfsa_p2'],
        'Non-Registered': ['withdraw_nonreg_p1', 'withdraw_nonreg_p2'],
        'Corporate': ['withdraw_corp_p1', 'withdraw_corp_p2']
    }

    for category, cols in withdraw_cols.items():
        for col in cols:
            if col not in df_work.columns:
                df_work[col] = 0.0

    benefit_cols = ['cpp_p1', 'cpp_p2', 'oas_p1', 'oas_p2', 'gis_p1', 'gis_p2']
    for col in benefit_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Create figure
    fig = go.Figure()

    # Define colors
    colors = {
        'RRIF': '#D32F2F',      # Red - fully taxable
        'Non-Registered': '#F57C00',  # Orange - partially taxable
        'Benefits': '#1976D2',   # Blue - partially taxable
        'TFSA': '#388E3C'       # Green - tax-free
    }

    # Add traces in order (bottom to top)
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work[['withdraw_rrif_p1', 'withdraw_rrif_p2']].sum(axis=1),
        mode='lines',
        name='RRIF (Fully Taxable)',
        line=dict(width=0.5, color=colors['RRIF']),
        fillcolor=colors['RRIF'],
        stackgroup='one',
        hovertemplate='<b>RRIF</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work[['withdraw_nonreg_p1', 'withdraw_nonreg_p2']].sum(axis=1),
        mode='lines',
        name='Non-Reg (Partially Taxable)',
        line=dict(width=0.5, color=colors['Non-Registered']),
        fillcolor=colors['Non-Registered'],
        stackgroup='one',
        hovertemplate='<b>Non-Registered</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work[benefit_cols].sum(axis=1),
        mode='lines',
        name='Benefits (Partially Taxable)',
        line=dict(width=0.5, color=colors['Benefits']),
        fillcolor=colors['Benefits'],
        stackgroup='one',
        hovertemplate='<b>Benefits</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work[['withdraw_tfsa_p1', 'withdraw_tfsa_p2']].sum(axis=1),
        mode='lines',
        name='TFSA (Tax-Free)',
        line=dict(width=0.5, color=colors['TFSA']),
        fillcolor=colors['TFSA'],
        stackgroup='one',
        hovertemplate='<b>TFSA</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    fig.update_layout(
        title='Income Composition: Taxable vs Tax-Free Sources',
        xaxis_title='Year',
        yaxis_title='Annual Income ($)',
        height=400,
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(tickformat='$,.0f')
    )

    return fig


def create_household_inflows_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Household Inflows by Source & Spend Target chart.

    Shows stacked bar chart of annual cash inflows by source (withdrawals, benefits, distributions)
    compared to spending target as a line overlay.

    Sources include:
    - Non-Registered withdrawals
    - RRIF withdrawals
    - TFSA withdrawals
    - Corporate withdrawals
    - CPP, OAS, GIS government benefits
    - Non-Registered distributions (interest, dividends, capital gains)

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    withdrawal_cols = {
        'Non-Reg': ['withdraw_nonreg_p1', 'withdraw_nonreg_p2'],
        'RRIF': ['withdraw_rrif_p1', 'withdraw_rrif_p2'],
        'TFSA': ['withdraw_tfsa_p1', 'withdraw_tfsa_p2'],
        'Corp': ['withdraw_corp_p1', 'withdraw_corp_p2'],
    }

    benefit_cols = {
        'CPP': ['cpp_p1', 'cpp_p2'],
        'OAS': ['oas_p1', 'oas_p2'],
        'GIS': ['gis_p1', 'gis_p2'],
    }

    # Add NR Distributions
    nr_dist_cols = ['nr_interest_p1', 'nr_interest_p2',
                    'nr_elig_div_p1', 'nr_elig_div_p2',
                    'nr_nonelig_div_p1', 'nr_nonelig_div_p2',
                    'nr_capg_dist_p1', 'nr_capg_dist_p2']

    spend_col = 'spend_target_after_tax'

    # Ensure all columns exist
    for col_list in list(withdrawal_cols.values()) + list(benefit_cols.values()) + [nr_dist_cols]:
        for col in col_list:
            if col not in df_work.columns:
                df_work[col] = 0.0
    if spend_col not in df_work.columns:
        df_work[spend_col] = 0.0
    if 'year' not in df_work.columns:
        df_work['year'] = range(1, len(df_work) + 1)

    # Create figure
    fig = go.Figure()

    # Define colors for each source
    colors = {
        'Non-Reg': '#1976D2',      # Blue
        'RRIF': '#D32F2F',         # Red
        'TFSA': '#388E3C',         # Green
        'Corp': '#F57C00',         # Orange
        'CPP': '#7B1FA2',          # Purple
        'OAS': '#C2185B',          # Pink
        'GIS': '#00838F',          # Teal
        'NR Distributions': '#BF360C',  # Deep Orange
    }

    # Add traces for withdrawals
    for source, cols in withdrawal_cols.items():
        df_work[source] = df_work[cols].sum(axis=1)
        fig.add_trace(go.Bar(
            x=df_work['year'],
            y=df_work[source],
            name=source,
            marker=dict(color=colors[source]),
            hovertemplate='<b>' + source + '</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
        ))

    # Add traces for benefits
    for benefit, cols in benefit_cols.items():
        df_work[benefit] = df_work[cols].sum(axis=1)
        fig.add_trace(go.Bar(
            x=df_work['year'],
            y=df_work[benefit],
            name=benefit,
            marker=dict(color=colors[benefit]),
            hovertemplate='<b>' + benefit + '</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
        ))

    # Add NR Distributions
    df_work['NR Distributions'] = df_work[nr_dist_cols].sum(axis=1)
    fig.add_trace(go.Bar(
        x=df_work['year'],
        y=df_work['NR Distributions'],
        name='NR Distributions',
        marker=dict(color=colors['NR Distributions']),
        hovertemplate='<b>NR Distributions</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    # Add spending target as line overlay
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work[spend_col],
        name='Spend Target (after tax)',
        mode='lines',
        line=dict(color='#666666', width=3, dash='dash'),
        hovertemplate='<b>Spend Target</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    fig.update_layout(
        title='Household Inflows by Source & Spend Target',
        xaxis_title='Year',
        yaxis_title='Inflows ($)',
        height=400,
        barmode='stack',
        hovermode='x unified',
        template='plotly_white',
        yaxis=dict(tickformat='$,.0f'),
        legend=dict(
            orientation='v',
            yanchor='top',
            y=0.99,
            xanchor='left',
            x=1.01
        )
    )

    return fig


def create_gis_optimization_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create GIS Optimization Analysis chart.

    Shows GIS benefit, clawback, and income headroom over time for GIS-optimized strategy.

    Args:
        df: Simulation results DataFrame

    Returns:
        Plotly Figure
    """
    df_work = df.copy()

    # Ensure required columns exist
    gis_cols = ['gis_p1', 'gis_p2', 'gis_clawback_p1', 'gis_clawback_p2',
                'gis_income_headroom_p1', 'gis_income_headroom_p2']
    for col in gis_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # Aggregate to household level
    df_work['GIS Benefit'] = df_work['gis_p1'] + df_work['gis_p2']
    df_work['GIS Clawback'] = df_work['gis_clawback_p1'] + df_work['gis_clawback_p2']
    df_work['GIS Headroom'] = df_work['gis_income_headroom_p1'] + df_work['gis_income_headroom_p2']

    # Create subplots: GIS Benefit (top), Clawback (middle), Headroom (bottom)
    from plotly.subplots import make_subplots

    fig = make_subplots(
        rows=3, cols=1,
        subplot_titles=('GIS Annual Benefit', 'GIS Clawback Risk', 'Income Headroom to Threshold'),
        specs=[[{'secondary_y': False}],
               [{'secondary_y': False}],
               [{'secondary_y': False}]],
        vertical_spacing=0.12,
        row_heights=[0.33, 0.33, 0.34]
    )

    # Row 1: GIS Benefit (stacked bars for P1 and P2)
    fig.add_trace(
        go.Bar(x=df_work['year'], y=df_work['gis_p1'], name='GIS - Person 1',
               marker_color='#1976D2', hovertemplate='<b>GIS P1</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=df_work['year'], y=df_work['gis_p2'], name='GIS - Person 2',
               marker_color='#388E3C', hovertemplate='<b>GIS P2</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'),
        row=1, col=1
    )

    # Row 2: GIS Clawback (shows impact of over-threshold income)
    fig.add_trace(
        go.Scatter(x=df_work['year'], y=df_work['GIS Clawback'],
                   mode='lines+markers', name='GIS Clawback',
                   line=dict(color='#D32F2F', width=2),
                   fill='tozeroy', fillcolor='rgba(211, 47, 47, 0.2)',
                   hovertemplate='<b>GIS Clawback</b><br>Year %{x}<br>$%{y:,.0f} lost<extra></extra>'),
        row=2, col=1
    )

    # Row 3: Income Headroom (distance to next GIS tier)
    fig.add_trace(
        go.Scatter(x=df_work['year'], y=df_work['GIS Headroom'],
                   mode='lines+markers', name='Income Headroom',
                   line=dict(color='#F57C00', width=2),
                   fill='tozeroy', fillcolor='rgba(245, 124, 0, 0.2)',
                   hovertemplate='<b>Income Headroom</b><br>Year %{x}<br>$%{y:,.0f} remaining<extra></extra>'),
        row=3, col=1
    )

    # Update layout
    fig.update_yaxes(title_text='Annual Benefit ($)', tickformat='$,.0f', row=1, col=1)
    fig.update_yaxes(title_text='Clawback Loss ($)', tickformat='$,.0f', row=2, col=1)
    fig.update_yaxes(title_text='Headroom ($)', tickformat='$,.0f', row=3, col=1)
    fig.update_xaxes(title_text='Year', row=3, col=1)

    fig.update_layout(
        title='GIS Optimization Analysis Over Time',
        height=900,
        hovermode='x unified',
        template='plotly_white',
        barmode='stack',
        showlegend=True
    )

    return fig


def create_tax_accumulated_chart(df: pd.DataFrame) -> go.Figure:
    """
    Create Tax Accumulated Over Years chart (Tier 2).

    Shows cumulative total tax paid over the retirement period with visual breakdown:
    - Federal tax (dark blue line)
    - Provincial tax (light blue line)
    - OAS clawback (orange stacked area)
    - Total cumulative tax (red line overlay)

    Includes summary annotation box with:
    - Total tax paid
    - Average annual tax
    - Peak tax year and amount

    Args:
        df: Simulation results DataFrame with columns:
            - year: Year identifier
            - total_tax_after_split: Total annual tax after income splitting
            - tax_fed_total_after_split: Federal tax (or estimated if not available)
            - tax_prov_total_after_split: Provincial tax (or estimated if not available)
            - oas_clawback_p1, oas_clawback_p2: OAS clawback amounts

    Returns:
        Plotly Figure with stacked area chart and overlay line
    """
    df_work = df.copy()

    # Ensure required columns exist
    required_cols = ['year', 'total_tax_after_split']
    for col in required_cols:
        if col not in df_work.columns:
            df_work[col] = 0.0

    # For breakdown, try to separate federal vs provincial
    # If not available, we'll estimate based on total
    if 'tax_fed_total_after_split' not in df_work.columns:
        # Estimate: assume ~40% federal, ~60% provincial (rough average for Canada)
        df_work['tax_fed_total_after_split'] = df_work['total_tax_after_split'] * 0.40
        df_work['tax_prov_total_after_split'] = df_work['total_tax_after_split'] * 0.60
    else:
        if 'tax_prov_total_after_split' not in df_work.columns:
            df_work['tax_prov_total_after_split'] = (
                df_work['total_tax_after_split'] - df_work['tax_fed_total_after_split']
            )

    # OAS clawback (if available)
    if 'oas_clawback_p1' not in df_work.columns:
        df_work['oas_clawback_p1'] = 0.0
    if 'oas_clawback_p2' not in df_work.columns:
        df_work['oas_clawback_p2'] = 0.0

    df_work['oas_clawback_total'] = df_work['oas_clawback_p1'] + df_work['oas_clawback_p2']

    # Calculate cumulative tax
    df_work['cumulative_tax'] = df_work['total_tax_after_split'].fillna(0).cumsum()

    # Calculate cumulative by type
    df_work['cumulative_fed'] = df_work['tax_fed_total_after_split'].fillna(0).cumsum()
    df_work['cumulative_prov'] = df_work['tax_prov_total_after_split'].fillna(0).cumsum()
    df_work['cumulative_oas_clawback'] = df_work['oas_clawback_total'].fillna(0).cumsum()

    # Create figure with secondary y-axis
    fig = go.Figure()

    # Add separate line traces for Federal and Provincial tax (not stacked)
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['cumulative_fed'],
        mode='lines+markers',
        name='Federal Tax (Cumulative)',
        line=dict(width=2, color='#1976D2'),
        marker=dict(size=3),
        hovertemplate='<b>Federal Tax</b><br>Year %{x}<br>Cumulative: $%{y:,.0f}<extra></extra>'
    ))

    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['cumulative_prov'],
        mode='lines+markers',
        name='Provincial Tax (Cumulative)',
        line=dict(width=2, color='#64B5F6'),
        marker=dict(size=3),
        hovertemplate='<b>Provincial Tax</b><br>Year %{x}<br>Cumulative: $%{y:,.0f}<extra></extra>'
    ))

    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['cumulative_oas_clawback'],
        mode='lines',
        name='OAS Clawback (Cumulative)',
        line=dict(width=0.5, color='#F57C00'),
        fillcolor='#F57C00',
        stackgroup='cumulative',
        hovertemplate='<b>OAS Clawback</b><br>Year %{x}<br>Cumulative: $%{y:,.0f}<extra></extra>'
    ))

    # Add total line overlay on cumulative
    fig.add_trace(go.Scatter(
        x=df_work['year'],
        y=df_work['cumulative_tax'],
        mode='lines+markers',
        name='Total Tax (Cumulative)',
        line=dict(color='#D32F2F', width=3),
        marker=dict(size=4),
        hovertemplate='<b>Total Cumulative Tax</b><br>Year %{x}<br>$%{y:,.0f}<extra></extra>'
    ))

    # Update layout
    fig.update_xaxes(title_text='Year')
    fig.update_yaxes(
        title_text='Cumulative Tax ($)',
        tickformat='$,.0f'
    )

    # Calculate summary statistics for annotations
    total_tax = df_work['total_tax_after_split'].sum()
    avg_annual_tax = df_work['total_tax_after_split'].mean()
    peak_tax_year = df_work.loc[df_work['total_tax_after_split'].idxmax(), 'year'] if len(df_work) > 0 else 0
    peak_tax_amount = df_work['total_tax_after_split'].max()

    # Add annotations
    annotation_text = (
        f"<b>Tax Summary</b><br>"
        f"Total: ${total_tax:,.0f}<br>"
        f"Annual Avg: ${avg_annual_tax:,.0f}<br>"
        f"Peak Year {int(peak_tax_year)}: ${peak_tax_amount:,.0f}"
    )

    fig.add_annotation(
        text=annotation_text,
        xref='paper', yref='paper',
        x=0.98, y=0.97,
        showarrow=False,
        bgcolor='rgba(255, 255, 255, 0.8)',
        bordercolor='#D32F2F',
        borderwidth=1,
        font=dict(size=11),
        xanchor='right',
        yanchor='top'
    )

    fig.update_layout(
        title='Tax Accumulated Over Years',
        height=450,
        hovermode='x unified',
        template='plotly_white',
        legend=dict(
            orientation='v',
            yanchor='bottom',
            y=0.01,
            xanchor='left',
            x=0.01
        )
    )

    return fig
