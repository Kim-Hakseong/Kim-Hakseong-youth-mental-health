// 통계 데이터
const healthData = {
    stress: [
        { year: 2018, rate: 35.2 },
        { year: 2019, rate: 33.8 },
        { year: 2020, rate: 30.5 },
        { year: 2021, rate: 32.1 },
        { year: 2022, rate: 34.7 }
    ],
    depression: [
        { year: 2018, rate: 27.1 },
        { year: 2019, rate: 25.8 },
        { year: 2020, rate: 23.4 },
        { year: 2021, rate: 24.9 },
        { year: 2022, rate: 26.3 }
    ],
    suicide: [
        { year: 2018, rate: 12.7 },
        { year: 2019, rate: 11.9 },
        { year: 2020, rate: 10.8 },
        { year: 2021, rate: 11.2 },
        { year: 2022, rate: 12.1 }
    ]
};

// 차트 설정
const chartConfig = {
    stress: {
        label: '스트레스 인지율',
        color: '#4a90e2',
        unit: '%'
    },
    depression: {
        label: '우울감 경험률',
        color: '#e74c3c',
        unit: '%'
    },
    suicide: {
        label: '자살 생각률',
        color: '#2c3e50',
        unit: '%'
    }
};

// DOM 요소
const indicatorSelect = document.getElementById('indicator-select');
const chartTypeSelect = document.getElementById('chart-type-select');
const chartCanvas = document.getElementById('healthChart');

// 전역 변수
let healthChart = null;

// 차트 생성
function createChart(indicator, type) {
    const data = healthData[indicator];
    const config = chartConfig[indicator];
    
    const chartData = {
        labels: data.map(item => item.year),
        datasets: [{
            label: config.label,
            data: data.map(item => item.rate),
            backgroundColor: type === 'bar' ? config.color : 'transparent',
            borderColor: config.color,
            borderWidth: 2,
            fill: type === 'line',
            tension: 0.4
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${config.label}: ${context.raw}${config.unit}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '비율 (%)',
                    font: {
                        size: 14
                    }
                },
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: '연도',
                    font: {
                        size: 14
                    }
                }
            }
        }
    };

    // 기존 차트 제거
    if (healthChart) {
        healthChart.destroy();
    }

    // 새 차트 생성
    healthChart = new Chart(chartCanvas, {
        type: type,
        data: chartData,
        options: options
    });
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    // 초기 차트 생성
    createChart(indicatorSelect.value, chartTypeSelect.value);

    // 지표 변경 시 차트 업데이트
    indicatorSelect.addEventListener('change', () => {
        createChart(indicatorSelect.value, chartTypeSelect.value);
    });

    // 차트 종류 변경 시 차트 업데이트
    chartTypeSelect.addEventListener('change', () => {
        createChart(indicatorSelect.value, chartTypeSelect.value);
    });
}); 