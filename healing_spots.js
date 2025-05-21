// API 키 설정
const PUBLIC_DATA_API_KEY = 'YOUR_PUBLIC_DATA_API_KEY';
const KAKAO_MAP_API_KEY = 'YOUR_KAKAO_MAP_API_KEY';

// DOM 요소
const categorySelect = document.getElementById('category-select');
const distanceSelect = document.getElementById('distance-select');
const searchButton = document.getElementById('search-button');
const spotsGrid = document.querySelector('.spots-grid');
const locationModal = document.getElementById('location-modal');
const allowLocationButton = document.getElementById('allow-location');
const denyLocationButton = document.getElementById('deny-location');
const closeModalButton = document.querySelector('.close-modal');

// 전역 변수
let map = null;
let markers = [];
let currentPosition = null;

// 지도 초기화
function initMap() {
    const mapContainer = document.getElementById('map');
    const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780); // 서울시청 좌표
    
    map = new kakao.maps.Map(mapContainer, {
        center: defaultPosition,
        level: 3
    });
}

// 위치 정보 가져오기
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                resolve(currentPosition);
            },
            (error) => {
                reject(error);
            }
        );
    });
}

// 공공데이터 API 호출
async function fetchPublicData(category, lat, lng, radius) {
    const baseUrl = 'http://api.data.go.kr/openapi/';
    let endpoint = '';
    let params = {};

    switch (category) {
        case 'park':
            endpoint = 'tn_pubr_public_park_api';
            params = {
                serviceKey: PUBLIC_DATA_API_KEY,
                type: 'json',
                pageNo: 1,
                numOfRows: 100,
                latitude: lat,
            };
            break;
        case 'library':
            endpoint = 'tn_pubr_public_library_api';
            params = {
                serviceKey: PUBLIC_DATA_API_KEY,
                type: 'json',
                pageNo: 1,
                numOfRows: 100,
                latitude: lat,
            };
            break;
        case 'youth':
            endpoint = 'tn_pubr_public_youth_facility_api';
            params = {
                serviceKey: PUBLIC_DATA_API_KEY,
                type: 'json',
                pageNo: 1,
                numOfRows: 100,
                latitude: lat,
            };
            break;
    }

    try {
        const response = await fetch(`${baseUrl}${endpoint}?${new URLSearchParams(params)}`);
        const data = await response.json();
        return data.response.body.items;
    } catch (error) {
        console.error('Error fetching public data:', error);
        return [];
    }
}

// 마커 생성
function createMarker(lat, lng, title) {
    const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        title: title
    });

    const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${title}</div>`
    });

    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });

    return marker;
}

// 마커 초기화
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// 시설 카드 생성
function createSpotCard(spot) {
    const card = document.createElement('div');
    card.className = 'spot-card';
    
    card.innerHTML = `
        <h3>${spot.name}</h3>
        <div class="spot-info">
            <p><i class="fas fa-map-marker-alt"></i>${spot.address}</p>
            ${spot.phone ? `<p><i class="fas fa-phone"></i>${spot.phone}</p>` : ''}
        </div>
        <p class="spot-description">${spot.description || '상세 정보가 없습니다.'}</p>
    `;
    
    card.addEventListener('click', () => {
        const marker = createMarker(spot.latitude, spot.longitude, spot.name);
        marker.setMap(map);
        map.setCenter(new kakao.maps.LatLng(spot.latitude, spot.longitude));
    });
    
    return card;
}

// 시설 목록 표시
function displaySpots(spots) {
    spotsGrid.innerHTML = '';
    clearMarkers();
    
    spots.forEach(spot => {
        spotsGrid.appendChild(createSpotCard(spot));
        const marker = createMarker(spot.latitude, spot.longitude, spot.name);
        marker.setMap(map);
        markers.push(marker);
    });
}

// 위치 검색 실행
async function searchNearbySpots() {
    try {
        const position = await getCurrentPosition();
        const category = categorySelect.value;
        const radius = parseInt(distanceSelect.value);
        
        const spots = await fetchPublicData(category, position.lat, position.lng, radius);
        displaySpots(spots);
        
        // 지도 중심 이동
        map.setCenter(new kakao.maps.LatLng(position.lat, position.lng));
        
        // 현재 위치 마커 표시
        const currentMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(position.lat, position.lng),
            title: '현재 위치'
        });
        currentMarker.setMap(map);
        markers.push(currentMarker);
        
    } catch (error) {
        console.error('Error searching nearby spots:', error);
        alert('위치 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
    }
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    searchButton.addEventListener('click', () => {
        locationModal.style.display = 'block';
    });
    
    allowLocationButton.addEventListener('click', () => {
        locationModal.style.display = 'none';
        searchNearbySpots();
    });
    
    denyLocationButton.addEventListener('click', () => {
        locationModal.style.display = 'none';
        alert('위치 정보 없이는 주변 시설을 찾을 수 없습니다.');
    });
    
    closeModalButton.addEventListener('click', () => {
        locationModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === locationModal) {
            locationModal.style.display = 'none';
        }
    });
    
    categorySelect.addEventListener('change', () => {
        if (currentPosition) {
            searchNearbySpots();
        }
    });
    
    distanceSelect.addEventListener('change', () => {
        if (currentPosition) {
            searchNearbySpots();
        }
    });
}); 