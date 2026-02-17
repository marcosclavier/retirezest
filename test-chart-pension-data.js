// Test script to check if pension data is present in chart data
// Run this in browser console while on the simulation page

// Get React props from the chart component
const checkChartData = () => {
  // Try to find the chart component in React DevTools
  const chartElements = document.querySelectorAll('[class*="recharts"]');
  console.log('Found chart elements:', chartElements.length);

  // Check if window has any debug data
  if (window.__CHART_DATA__) {
    console.log('Chart data from debug:', window.__CHART_DATA__);
  }

  // Look for console logs
  console.log('Please check the console for "TotalIncomeSourcesChart" and "Year 20XX income breakdown" logs');
  console.log('These will show the actual pension values being passed to the chart');
};

checkChartData();

// Also check if the simulation result has pension data
if (window.__SIMULATION_RESULT__) {
  const result = window.__SIMULATION_RESULT__;
  console.log('Year-by-year sample:', {
    year: result.year_by_year[0].year,
    cpp_p1: result.year_by_year[0].cpp_p1,
    oas_p1: result.year_by_year[0].oas_p1,
    gis_p1: result.year_by_year[0].gis_p1
  });

  console.log('Chart data sample:', {
    year: result.chart_data.data_points[0].year,
    cpp_total: result.chart_data.data_points[0].cpp_total,
    oas_total: result.chart_data.data_points[0].oas_total,
    gis_total: result.chart_data.data_points[0].gis_total
  });
}