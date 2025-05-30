// API 엔드포인트
const API_ENDPOINT = 'https://api.example.com/health-stats'; // 실제 API 엔드포인트로 변경 필요

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
let healthData = null;

// 통계 데이터 가져오기
async function fetchHealthStats() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching health stats:', error);
        throw error;
    }
}

// 차트 생성
function createChart(indicator, type) {
    if (!healthData || !healthData[indicator]) {
        throw new Error('No data available for the selected indicator');
    }

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

// 차트 업데이트
function updateChart() {
    try {
        const indicator = indicatorSelect.value;
        const type = chartTypeSelect.value;
        createChart(indicator, type);
    } catch (error) {
        console.error('Error updating chart:', error);
        chartCanvas.innerHTML = '<div class="error">차트를 표시하는데 실패했습니다. 다시 시도해주세요.</div>';
    }
}

// 초기화
async function initialize() {
    try {
        // 로딩 표시
        chartCanvas.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
        
        // 통계 데이터 가져오기
        healthData = await fetchHealthStats();
        
        // 초기 차트 생성
        updateChart();

        // 이벤트 리스너 설정
        indicatorSelect.addEventListener('change', updateChart);
        chartTypeSelect.addEventListener('change', updateChart);
    } catch (error) {
        console.error('Error initializing:', error);
        chartCanvas.innerHTML = '<div class="error">데이터를 불러오는데 실패했습니다. 다시 시도해주세요.</div>';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize); 