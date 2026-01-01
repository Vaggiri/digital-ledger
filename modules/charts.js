export const Charts = {
    renderSpending(canvasId, dataMap) {
        const ctxCanvas = document.getElementById(canvasId);
        if (!ctxCanvas) return;

        const ctx = ctxCanvas.getContext('2d');
        const labels = Object.keys(dataMap);
        const values = Object.values(dataMap);

        if (labels.length === 0) {
            // No data to show
            return;
        }

        // Destroy previous chart if exists on this canvas
        if (window.mySpendingChart) {
            window.mySpendingChart.destroy();
        }

        // Create Gradients
        const gradientGold = ctx.createLinearGradient(0, 0, 0, 400);
        gradientGold.addColorStop(0, '#fbbf24');
        gradientGold.addColorStop(1, '#d97706');

        window.mySpendingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                datasets: [{
                    label: 'Spending',
                    data: values,
                    backgroundColor: gradientGold,
                    borderRadius: 8,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend for cleaner look
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }
};
