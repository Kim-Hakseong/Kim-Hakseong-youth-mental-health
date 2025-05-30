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

// API 엔드포인트 및 인증키
const API_CONFIG = {
    park: {
        url: 'https://api.data.go.kr/openapi/tn_pubr_public_cty_park_info_api',
        key: 'uM3N%2FpEZjbO2qFTiiWc7F6dSujuvdaaNQM39WD0bT%2F1%2FXYrS3iZ3q0LiIRVXMt%2Bvp5Zz0Ddzpl2k7%2BFnrR9V5w%3D%3D',
        parse: (item) => ({
            name: item.공원명,
            address: item.소재지도로명주소 || item.소재지지번주소,
            description: item.공원구분,
            lat: parseFloat(item.위도),
            lng: parseFloat(item.경도)
        })
    },
    library: {
        url: 'https://api.data.go.kr/openapi/tn_pubr_public_lbrry_api',
        key: 'uM3N%2FpEZjbO2qFTiiWc7F6dSujuvdaaNQM39WD0bT%2F1%2FXYrS3iZ3q0LiIRVXMt%2Bvp5Zz0Ddzpl2k7%2BFnrR9V5w%3D%3D',
        parse: (item) => ({
            name: item.도서관명,
            address: item.소재지도로명주소 || item.소재지지번주소,
            description: item.도서관유형명,
            lat: parseFloat(item.위도),
            lng: parseFloat(item.경도)
        })
    },
    youth: {
        url: 'https://api.data.go.kr/openapi/tn_pubr_public_teen_training_fclt_api',
        key: 'uM3N%2FpEZjbO2qFTiiWc7F6dSujuvdaaNQM39WD0bT%2F1%2FXYrS3iZ3q0LiIRVXMt%2Bvp5Zz0Ddzpl2k7%2BFnrR9V5w%3D%3D',
        parse: (item) => ({
            name: item.시설명,
            address: item.소재지도로명주소 || item.소재지지번주소,
            description: item.시설구분,
            lat: parseFloat(item.위도),
            lng: parseFloat(item.경도)
        })
    }
};

// 지도 초기화 (Leaflet)
function initMap() {
    map = L.map('map').setView([37.5665, 126.9780], 13); // 서울시청
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
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
async function fetchPublicData(category, lat, lng, distance) {
    try {
        const config = API_CONFIG[category];
        if (!config) {
            throw new Error('Invalid category');
        }

        const url = new URL(config.url);
        url.searchParams.append('serviceKey', config.key);
        url.searchParams.append('numOfRows', '100');
        url.searchParams.append('pageNo', '1');
        url.searchParams.append('type', 'json');

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let items = [];
        
        if (data.response && data.response.body && data.response.body.items) {
            items = Array.isArray(data.response.body.items.item) 
                ? data.response.body.items.item 
                : [data.response.body.items.item];
        }

        if (!items || items.length === 0) {
            throw new Error('No data found');
        }

        // 위경도 필터링 (distance 단위: m)
        const filtered = items
            .map(config.parse)
            .filter(item => {
                if (!item.lat || !item.lng) return false;
                const dist = getDistanceFromLatLonInM(lat, lng, item.lat, item.lng);
                return dist <= distance;
            });

        return filtered;
    } catch (error) {
        console.error('Error fetching public data:', error);
        throw error;
    }
}

// 시설 표시
function displaySpots(spots) {
    // 기존 마커 제거
    markers.forEach(marker => marker.remove());
    markers = [];

    // 시설 목록 표시
    spotsGrid.innerHTML = spots.map(spot => `
        <div class="spot-card" data-lat="${spot.lat}" data-lng="${spot.lng}">
            <h3>${spot.name}</h3>
            <div class="spot-info">
                <p><i class="fas fa-map-marker-alt"></i>${spot.address}</p>
                <p><i class="fas fa-info-circle"></i>${spot.description}</p>
            </div>
        </div>
    `).join('');

    // 지도에 마커 표시
    spots.forEach(spot => {
        const marker = L.marker([spot.lat, spot.lng])
            .bindPopup(`
                <strong>${spot.name}</strong><br>
                ${spot.address}<br>
                ${spot.description}
            `)
            .addTo(map);
        markers.push(marker);
    });

    // 시설 카드 클릭 이벤트
    document.querySelectorAll('.spot-card').forEach(card => {
        card.addEventListener('click', () => {
            const lat = parseFloat(card.dataset.lat);
            const lng = parseFloat(card.dataset.lng);
            map.setView([lat, lng], 16);
            markers.find(m => m.getLatLng().lat === lat && m.getLatLng().lng === lng).openPopup();
        });
    });
}

// 위치 검색 실행
async function searchNearbySpots() {
    try {
        const position = await getCurrentPosition();
        const category = categorySelect.value;
        const radius = parseInt(distanceSelect.value);
        
        // 로딩 표시
        spotsGrid.innerHTML = '<div class="loading">검색 중...</div>';
        
        const spots = await fetchPublicData(category, position.lat, position.lng, radius);
        
        if (spots.length === 0) {
            spotsGrid.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            return;
        }

        displaySpots(spots);
        
        // 지도 중심 이동
        map.setView([position.lat, position.lng], 13);
        
        // 현재 위치 마커 표시
        const currentMarker = L.marker([position.lat, position.lng])
            .bindPopup('현재 위치')
            .addTo(map);
        markers.push(currentMarker);
    } catch (error) {
        console.error('Error searching nearby spots:', error);
        spotsGrid.innerHTML = '<div class="error">검색 중 오류가 발생했습니다. 다시 시도해주세요.</div>';
    }
}

// 위경도 거리 계산 함수 (Haversine 공식)
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 지구 반지름(m)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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