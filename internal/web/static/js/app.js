// Global state
let globalData = null;
let monthlyTrendsChart = null;
let categoryPieChart = null;

// Chart.js global configuration
Chart.defaults.color = '#b3b3b3';
Chart.defaults.borderColor = '#404040';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// Data fetching and initialization
async function initialize() {
    showLoading(true);
    try {
        const data = await fetchData();
        if (data) {
            globalData = data;
            updateSummaryStats(data);
            initializeCharts(data);
            initializeEventListeners();
            updateTopExpensesTable(data, 'both');
        }
    } catch (error) {
        showError('Failed to load dashboard data');
        console.error('Initialization error:', error);
    }
    showLoading(false);
}

async function fetchData() {
    try {
        const response = await fetch('/expenses/processed');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        showError('Failed to fetch data from server');
        console.error('Data fetch error:', error);
        return null;
    }
}

// Chart Initialization
function initializeCharts(data) {
    if (monthlyTrendsChart) {
        monthlyTrendsChart.destroy();
    }
    if (categoryPieChart) {
        categoryPieChart.destroy();
    }
    
    initMonthlyTrendsChart(data);
    initCategoryPieChart(data);
}

function initMonthlyTrendsChart(data) {
    const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
    const { labels, datasets } = prepareMonthlyTrendsData(data);
    
    monthlyTrendsChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initCategoryPieChart(data) {
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    const { labels, values, colors } = preparePieChartData(data);
    
    categoryPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#2d2d2d'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        generateLabels: chart => {
                            const total = values.reduce((sum, value) => sum + value, 0);
                            return labels.map((label, i) => ({
                                text: `${label} (${((values[i] / total) * 100).toFixed(1)}%)`,
                                fillStyle: colors[i],
                                strokeStyle: colors[i],
                                lineWidth: 0,
                                hidden: false
                            }));
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Data Processing Functions
function prepareMonthlyTrendsData(data) {
    const months = [...new Set(data.monthlyTotals.map(item => 
        formatMonth(item.month)))].sort();
    const categories = [...new Set(data.monthlyTotals.map(item => item.category))];
    const colors = generateColors(categories.length);
    
    const datasets = categories.map((category, index) => ({
        label: category,
        data: months.map(month => {
            const found = data.monthlyTotals.find(item => 
                formatMonth(item.month) === month && item.category === category
            );
            return found ? found.total : 0;
        }),
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.4,
        fill: true
    }));

    return { labels: months, datasets };
}

function preparePieChartData(data) {
    const currentMonthData = data.categoryBreakdown;
    const labels = currentMonthData.map(item => item.category);
    const values = currentMonthData.map(item => item.total);
    const colors = generateColors(labels.length);
    
    return { labels, values, colors };
}

// Event Listeners
function initializeEventListeners() {
    document.getElementById('timeRange').addEventListener('change', (e) => {
        updateTopExpensesTable(globalData, e.target.value);
    });

    document.getElementById('chartType').addEventListener('change', (e) => {
        if (monthlyTrendsChart) {
            monthlyTrendsChart.config.type = e.target.value;
            monthlyTrendsChart.update();
        }
    });
}

// UI Updates
function updateSummaryStats(data) {
    const currentMonthTotal = data.categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
    const previousMonthTotal = calculatePreviousMonthTotal(data);
    
    document.getElementById('thisMonthTotal').textContent = formatCurrency(currentMonthTotal);
    document.getElementById('avgMonthly').textContent = formatCurrency(calculateAverageMonthly(data));
    document.getElementById('topCategory').textContent = data.categoryBreakdown[0]?.category || 'N/A';
    
    updateTrendIndicator(currentMonthTotal, previousMonthTotal);
}

function updateTopExpensesTable(data, timeRange) {
    const tbody = document.getElementById('topExpensesTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    const filteredExpenses = filterExpensesByTimeRange(data.topExpenses, timeRange);
    
    filteredExpenses.forEach(expense => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td class="amount">${formatCurrency(expense.amount)}</td>
            <td>${formatDate(expense.date)}</td>
        `;
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatMonth(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
    });
}

function generateColors(count) {
    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
        '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
    ];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
}

function calculateAverageMonthly(data) {
    const totals = data.monthlyTotals.reduce((acc, item) => {
        const month = formatMonth(item.month);
        acc[month] = (acc[month] || 0) + item.total;
        return acc;
    }, {});
    
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    return sum / Object.keys(totals).length;
}

function calculatePreviousMonthTotal(data) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const lastMonthStr = formatMonth(lastMonth);
    
    return data.monthlyTotals
        .filter(item => formatMonth(item.month) === lastMonthStr)
        .reduce((sum, item) => sum + item.total, 0);
}

function filterExpensesByTimeRange(expenses, timeRange) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        switch (timeRange) {
            case 'current':
                return expenseDate >= startOfCurrentMonth;
            case 'last':
                return expenseDate >= startOfLastMonth && expenseDate < startOfCurrentMonth;
            default: // 'both'
                return expenseDate >= startOfLastMonth;
        }
    });
}

function updateTrendIndicator(current, previous) {
    const change = previous ? ((current - previous) / previous) * 100 : 0;
    const trendElement = document.getElementById('monthTrend');
    
    trendElement.textContent = change === 0 ? '' :
        `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}%`;
    trendElement.className = `trend-indicator ${change > 0 ? 'trend-up' : 'trend-down'}`;
}

// UI Feedback
function showLoading(show) {
    const loader = document.getElementById('loader');
    if (show) {
        if (!loader) {
            const div = document.createElement('div');
            div.id = 'loader';
            div.className = 'loader';
            document.querySelector('main').prepend(div);
        }
    } else if (loader) {
        loader.remove();
    }
}

function showError(message) {
    // Implement error display logic here
    console.error(message);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
