// Fetch and process data
async function fetchData() {
    try {
        const response = await fetch('/expenses/processed');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Initialize monthly trends chart
function initMonthlyTrendsChart(data) {
    const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
    
    // Process data for chart
    const months = [...new Set(data.monthlyTotals.map(item => 
        new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })))];
    const categories = [...new Set(data.monthlyTotals.map(item => item.category))];
    
    const datasets = categories.map(category => {
        const categoryData = months.map(month => {
            const found = data.monthlyTotals.find(item => 
                new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === month 
                && item.category === category
            );
            return found ? found.total : 0;
        });

        return {
            label: category,
            data: categoryData,
            fill: false,
            tension: 0.4
        };
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Expenses by Category'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Initialize category pie chart
function initCategoryPieChart(data) {
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    
    const chartData = {
        labels: data.categoryBreakdown.map(item => item.category),
        datasets: [{
            data: data.categoryBreakdown.map(item => item.total),
            backgroundColor: generateColors(data.categoryBreakdown.length)
        }]
    };

    new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        generateLabels: (chart) => {
                            const datasets = chart.data.datasets;
                            return chart.data.labels.map((label, i) => ({
                                text: `${label} (${data.categoryBreakdown[i].percentage.toFixed(1)}%)`,
                                fillStyle: datasets[0].backgroundColor[i],
                                hidden: false,
                                index: i
                            }));
                        }
                    }
                }
            }
        }
    });
}

// Populate top expenses table
function populateTopExpensesTable(data) {
    const tbody = document.getElementById('topExpensesTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    data.topExpenses.forEach(expense => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${expense.name}</td>
            <td>${expense.category}</td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td>${new Date(expense.date).toLocaleDateString()}</td>
        `;
    });
}

// Generate colors for pie chart
function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360) / count;
        colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
}

// Initialize everything
async function initialize() {
    const data = await fetchData();
    if (data) {
        initMonthlyTrendsChart(data);
        initCategoryPieChart(data);
        populateTopExpensesTable(data);
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
