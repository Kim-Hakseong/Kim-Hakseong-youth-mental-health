// 도움기관 데이터
const helpingCenters = [
    {
        name: "OO청소년상담복지센터",
        address: "서울특별시 강남구 테헤란로 123",
        phone: "02-123-4567",
        services: ["개인상담", "집단상담"],
        region: "서울",
        latitude: 37.500000,
        longitude: 127.030000
    },
    {
        name: "XX마음건강센터",
        address: "부산광역시 해운대구 우동 456",
        phone: "051-789-0123",
        services: ["심리검사", "가족상담"],
        region: "부산",
        latitude: 35.160000,
        longitude: 129.160000
    }
    // 추가 기관 데이터...
];

// DOM 요소
const regionSelect = document.getElementById('region-select');
const centersGrid = document.querySelector('.centers-grid');
const mapModal = document.getElementById('map-modal');
const closeModal = document.querySelector('.close-modal');
let map = null;
let currentMarker = null;

// 지역 목록 생성
function createRegionOptions() {
    const regions = [...new Set(helpingCenters.map(center => center.region))];
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
}

// 기관 카드 생성
function createCenterCard(center) {
    const card = document.createElement('div');
    card.className = 'center-card';
    
    card.innerHTML = `
        <h3>${center.name}</h3>
        <div class="center-info">
            <p><i class="fas fa-map-marker-alt"></i>${center.address}</p>
            <p><i class="fas fa-phone"></i>${center.phone}</p>
        </div>
        <div class="center-services">
            <h4>제공 서비스</h4>
            <div class="service-tags">
                ${center.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
            </div>
        </div>
        <button class="map-button" onclick="showMap(${center.latitude}, ${center.longitude}, '${center.name}')">
            <i class="fas fa-map"></i>지도에서 위치 보기
        </button>
    `;
    
    return card;
}

// 기관 목록 표시
function displayCenters(centers) {
    centersGrid.innerHTML = '';
    centers.forEach(center => {
        centersGrid.appendChild(createCenterCard(center));
    });
}

// 지역 필터링
function filterCenters(region) {
    const filtered = region === 'all' 
        ? helpingCenters 
        : helpingCenters.filter(center => center.region === region);
    displayCenters(filtered);
}

// 지도 표시
function showMap(lat, lng, name) {
    mapModal.style.display = 'block';
    
    // 지도 초기화
    if (!map) {
        const mapContainer = document.getElementById('map');
        map = new kakao.maps.Map(mapContainer, {
            center: new kakao.maps.LatLng(lat, lng),
            level: 3
        });
    } else {
        map.setCenter(new kakao.maps.LatLng(lat, lng));
    }
    
    // 마커 생성
    if (currentMarker) {
        currentMarker.setMap(null);
    }
    
    const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng)
    });
    
    marker.setMap(map);
    currentMarker = marker;
    
    // 인포윈도우 생성
    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${name}</div>`
    });
    
    infowindow.open(map, marker);
}

// 모달 닫기
function closeMapModal() {
    mapModal.style.display = 'none';
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    createRegionOptions();
    displayCenters(helpingCenters);
    
    regionSelect.addEventListener('change', (e) => {
        filterCenters(e.target.value);
    });
    
    closeModal.addEventListener('click', closeMapModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            closeMapModal();
        }
    });
}); 