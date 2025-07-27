// public/js/main.js

let map;
let userMarker; // 사용자 위치 마커
let poiMarkers = [];
let allPoiData = [];

// ----------- 지도 초기화 및 유틸 -----------
function initTmap() {
    map = new Tmapv2.Map("map_div", {
        center: new Tmapv2.LatLng(37.5652045, 126.98702028),
        width: "100%",
        height: "100%",
        zoom: 17
    });
    setupUserLocation();
    loadPoiMarkers();
    setupPoiSearch();
}

function setMapCenter(latLng) {
    if (map && latLng) map.setCenter(latLng);
}

// ----------- 내 위치 마커 -----------
function setupUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                const latLng = new Tmapv2.LatLng(pos.coords.latitude, pos.coords.longitude);
                if (userMarker) {
                    userMarker.setPosition(latLng);
                } else {
                    userMarker = new Tmapv2.Marker({
                        position: latLng,
                        icon: "/images/pin-red.svg",
                        map: map
                    });
                    setMapCenter(latLng);
                }
            },
            (err) => { alert("위치 추적 실패: " + err.message); },
            { enableHighAccuracy: false }
        );
    } else {
        alert("이 브라우저에서는 위치 정보 이용이 지원되지 않습니다.");
    }
}

// ----------- POI 마커 -----------
async function loadPoiMarkers() {
    clearPoiMarkers();
    try {
        const response = await fetch('/api/poi');
        const result = await response.json();
        if (!result.success || !Array.isArray(result.data)) {
            alert('POI 데이터를 불러올 수 없습니다.');
            return;
        }
        allPoiData = result.data;
        result.data.forEach((poi, idx) => {
            createPoiMarker(poi, idx);
        });
    } catch (error) {
        console.error(error);
        alert('POI 마커 로드 오류');
    }
}

function clearPoiMarkers() {
    poiMarkers.forEach(mk => mk.setMap(null));
    poiMarkers = [];
    allPoiData = [];
}

function createPoiMarker(poi, idx) {
    const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(Number(poi.latitude), Number(poi.longitude)),
        icon: "/images/pin-location.svg",
        map: map,
        title: poi.title
    });
    marker.poiId = poi.poiId || idx;
    marker.poiData = poi;
    // 마커 클릭시 지도 센터 이동
    marker.addListener("click", () => setMapCenter(marker.getPosition()));
    poiMarkers.push(marker);
}

// ----------- 검색 기능 -----------
function setupPoiSearch() {
    const searchInput = document.querySelector('input[type="search"]');
    const searchButton = document.querySelector('button[type="button"]');
    if (!searchInput || !searchButton) return;
    searchButton.addEventListener('click', handlePoiSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handlePoiSearch();
    });
}

function handlePoiSearch() {
    const searchInput = document.querySelector('input[type="search"]');
    const query = (searchInput.value || '').trim().toLowerCase();
    if (!query) {
        alert('검색어를 입력하세요.');
        return;
    }
    const foundIdx = allPoiData.findIndex(poi => (poi.title || '').toLowerCase().includes(query));
    if (foundIdx === -1) {
        alert('검색 결과가 없습니다.');
        return;
    }
    const marker = poiMarkers[foundIdx];
    if (marker) setMapCenter(marker.getPosition());
}

function resetSearchInput() {
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) searchInput.value = '';
}

// ----------- refresh 버튼 -----------
function setupRefreshBtn() {
    const refreshBtn = document.querySelector('button[aria-label="refresh"]');
    refreshBtn.addEventListener('click', function() {
        resetSearchInput();

        if (refreshBtn.disabled) return;
        refreshBtn.disabled = true;

        if (navigator.geolocation) {
            if (userMarker && typeof userMarker.getPosition === "function") {
                setMapCenter(userMarker.getPosition());
                loadPoiMarkers();
                refreshBtn.disabled = false;
            } else {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const latLng = new Tmapv2.LatLng(pos.coords.latitude, pos.coords.longitude);
                        setMapCenter(latLng);
                        userMarker = new Tmapv2.Marker({
                            position: latLng,
                            icon: "/images/pin-red.svg",
                            map: map
                        });
                        loadPoiMarkers();
                        refreshBtn.disabled = false;
                    },
                    () => {
                        alert("현재 위치를 가져올 수 없습니다.");
                        loadPoiMarkers();
                        refreshBtn.disabled = false;
                    }
                );
            }
        } else {
            loadPoiMarkers();
            refreshBtn.disabled = false;
        }
    });
}

// ----------- import 버튼 -----------
function setupImportBtn() {
    const importBtn = document.querySelector('button[aria-label="import"]');
    importBtn.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기는 10MB를 초과할 수 없습니다.');
                return;
            }
            uploadExcelFile(file);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });
}

// ----------- 파일 업로드 -----------
async function uploadExcelFile(file) {
    const formData = new FormData();
    formData.append('excelFile', file);

    const importBtn = document.querySelector('button[aria-label="import"]');
    const originalText = importBtn.querySelector('span').textContent;
    importBtn.querySelector('span').textContent = '업로드중...';
    importBtn.disabled = true;

    try {
        const response = await fetch('/api/poi/import', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            let message = result.message;
            if (result.data) {
                message += `\n\n상세 정보:`;
                message += `\n- 전체 행 수: ${result.data.totalRows}`;
                message += `\n- 유효한 행 수: ${result.data.validRows}`;
                message += `\n- 저장된 행 수: ${result.data.insertedRows}`;
                if (result.data.errorRows > 0) message += `\n- 오류 행 수: ${result.data.errorRows}`;
            }
            alert(message);
            const refreshBtn = document.querySelector('button[aria-label="refresh"]');
            if (refreshBtn) refreshBtn.click();
        } else {
            let errorMessage = '오류: ' + result.message;
            if (result.details && result.details.errors) {
                errorMessage += '\n\n오류 예시:';
                result.details.errors.slice(0, 3).forEach(error => {
                    errorMessage += `\n- ${error.row}행: ${error.errors.join(', ')}`;
                });
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('업로드 오류:', error);
        alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
        importBtn.querySelector('span').textContent = originalText;
        importBtn.disabled = false;
    }
}

// ----------- 페이지 로드 시 초기화 -----------
window.onload = function() {
    initTmap();
    setupRefreshBtn();
    setupImportBtn();
};
