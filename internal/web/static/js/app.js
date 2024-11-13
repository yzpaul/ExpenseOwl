// Global state for charts
let monthlyTrendsChart = null;
let categoryPieChart = null;

// Chart.js global defaults
Chart.defaults.color = '#b3b3b3';
Chart.defaults.borderColor = '#404040';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

async function initialize() {
    try {
        const response = await fetch('/expenses/processed');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        
        createCharts(data);
        updateExpensesTable(data.topExpenses);
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}

function createCharts(data) {
    createTrendsChart(data.monthlyTotals);
    createPieChart(data.categoryBreakdown);
}

function createTrendsChart(monthlyData) {
    if (monthlyTrendsChart) monthlyTrendsChart.destroy();
    
    // Get last 6 months only
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const months = [...new Set(monthlyData
        .map(item => new Date(item.month))
        .filter(date => date >= sixMonthsAgo)
        .map(date => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })))]
        .sort((a, b) => new Date(a) - new Date(b));
    
    const categories = [...new Set(monthlyData.map(item => item.category))];
    
    // Define fixed colors for consistency between charts
    const colors = {
        'Dining': '#FF6B6B',
        'Entertainment': '#4ECDC4',
        'Groceries': '#45B7D1',
        'Healthcare': '#96CEB4',
        'Rent': '#FFBE0B',
        'Shopping': '#FF006E',
        'Transportation': '#8338EC',
        'Utilities': '#3A86FF',
        'Food': '#FB5607'
    };

    const datasets = categories.map(category => ({
        label: category,
        data: months.map(month => {
            const sum = monthlyData
                .filter(item => 
                    new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) === month 
                    && item.category === category)
                .reduce((acc, curr) => acc + curr.total, 0);
            return sum;
        }),
        backgroundColor: colors[category] || '#38B000', // Default color if category not in map
        borderColor: '#1a1a1a',
        borderWidth: 1
    }));

    monthlyTrendsChart = new Chart('monthlyTrendsChart', {
        type: 'bar',
        data: { labels: months, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 40 // Extra padding for legend
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: formatCurrency
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    },
                    maxWidth: 400,
                    maxHeight: 50
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
                        footer: (tooltipItems) => {
                            const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
                            return `Total: ${formatCurrency(total)}`;
                        }
                    }
                }
            }
        }
    });
}

function createPieChart(categoryData) {
    if (categoryPieChart) categoryPieChart.destroy();
    
    const colors = {
        'Dining': '#FF6B6B',
        'Entertainment': '#4ECDC4',
        'Groceries': '#45B7D1',
        'Healthcare': '#96CEB4',
        'Rent': '#FFBE0B',
        'Shopping': '#FF006E',
        'Transportation': '#8338EC',
        'Utilities': '#3A86FF',
        'Food': '#FB5607'
    };
    
    categoryPieChart = new Chart('categoryPieChart', {
        type: 'doughnut',
        data: {
            labels: categoryData.map(c => c.category),
            datasets: [{
                data: categoryData.map(c => c.total),
                backgroundColor: categoryData.map(c => colors[c.category] || '#38B000'),
                borderColor: '#1a1a1a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 40
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    },
                    maxWidth: 400,
                    maxHeight: 50
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createPieChart(categoryData) {
    if (categoryPieChart) categoryPieChart.destroy();
    
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    
    categoryPieChart = new Chart('categoryPieChart', {
        type: 'doughnut',
        data: {
            labels: categoryData.map(c => c.category),
            datasets: [{
                data: categoryData.map(c => c.total),
                backgroundColor: colors.slice(0, categoryData.length),
                borderWidth: 2,
                borderColor: '#2d2d2d'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => formatCurrency(ctx.raw)
                    }
                }
            }
        }
    });
}

function updateExpensesTable(expenses) {
    const tbody = document.getElementById('topExpensesTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    expenses
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
        .forEach(expense => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${expense.name}</td>
                <td>${expense.category}</td>
                <td class="amount">${formatCurrency(expense.amount)}</td>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
            `;
        });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

function setupEventListeners() {
    document.getElementById('chartType').addEventListener('change', 
        e => monthlyTrendsChart && (monthlyTrendsChart.config.type = e.target.value) && monthlyTrendsChart.update());
}

document.addEventListener('DOMContentLoaded', () => {
    initialize();
    setupEventListeners();
});
