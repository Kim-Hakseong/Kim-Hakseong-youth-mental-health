// API 엔드포인트
const API_ENDPOINT = 'https://api.example.com/helping-centers'; // 실제 API 엔드포인트로 변경 필요

// DOM 요소
const regionSelect = document.getElementById('region-select');
const centersGrid = document.querySelector('.centers-grid');
const mapModal = document.getElementById('map-modal');
const closeModal = document.querySelector('.close-modal');
let map = null;
let currentMarker = null;

// 도움기관 데이터 가져오기
async function fetchHelpingCenters() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching helping centers:', error);
        throw error;
    }
}

// 지역 목록 생성
function createRegionOptions(centers) {
    const regions = [...new Set(centers.map(center => center.region))];
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
}

// 기관 카드 생성
function createCenterCard(center) {
    return `
        <div class="center-card">
            <h3>${center.name}</h3>
            <div class="center-info">
                <p><i class="fas fa-map-marker-alt"></i>${center.address}</p>
                <p><i class="fas fa-phone"></i>${center.phone}</p>
            </div>
            <div class="center-services">
                <h4>제공 서비스</h4>
                <div class="service-tags">
                    ${center.services.map(s => `<span class="service-tag">${s}</span>`).join('')}
                </div>
            </div>
            ${center.url ? `<a href="${center.url}" target="_blank" class="map-button"><i class="fas fa-external-link-alt"></i> 기관 홈페이지로 이동</a>` : `<button class="map-button" disabled>홈페이지 정보 없음</button>`}
            <button class="map-button" onclick="showMap(${center.latitude}, ${center.longitude}, '${center.name}')">
                <i class="fas fa-map-marked-alt"></i> 지도에서 보기
            </button>
        </div>
    `;
}

// 기관 목록 표시
function displayCenters(centers) {
    centersGrid.innerHTML = centers.map(createCenterCard).join('');
}

// 지역 필터링
function filterCenters(region, centers) {
    const filtered = region === 'all' 
        ? centers 
        : centers.filter(center => center.region === region);
    displayCenters(filtered);
}

// 지도 표시
function showMap(lat, lng, title) {
    mapModal.style.display = 'block';
    
    if (!map) {
        map = new kakao.maps.Map(document.getElementById('map'), {
            center: new kakao.maps.LatLng(lat, lng),
            level: 3
        });
    } else {
        map.setCenter(new kakao.maps.LatLng(lat, lng));
    }

    if (currentMarker) {
        currentMarker.setMap(null);
    }

    currentMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        map: map
    });

    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${title}</div>`
    });
    infowindow.open(map, currentMarker);
}

// 초기화
async function initialize() {
    try {
        // 로딩 표시
        centersGrid.innerHTML = '<div class="loading">기관 정보를 불러오는 중...</div>';
        
        // 도움기관 데이터 가져오기
        const centers = await fetchHelpingCenters();
        
        // 지역 목록 생성
        createRegionOptions(centers);
        
        // 기관 목록 표시
        displayCenters(centers);
        
        // 이벤트 리스너 설정
        regionSelect.addEventListener('change', () => {
            filterCenters(regionSelect.value, centers);
        });
        
        closeModal.addEventListener('click', () => {
            mapModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === mapModal) {
                mapModal.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error initializing:', error);
        centersGrid.innerHTML = '<div class="error">기관 정보를 불러오는데 실패했습니다. 다시 시도해주세요.</div>';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize); 