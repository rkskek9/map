const form = document.getElementById('route-form');
const originInput = document.getElementById('origin-input');
const destinationInput = document.getElementById('destination-input');
const originText = document.getElementById('origin-text');
const destinationText = document.getElementById('destination-text');
const distanceText = document.getElementById('distance-text');
const mapLink = document.getElementById('map-link');
const resultCard = document.getElementById('result-card');
const message = document.getElementById('message');
const submitBtn = document.getElementById('submit-btn');
const originDropdown = document.getElementById('origin-dropdown');
const destinationDropdown = document.getElementById('destination-dropdown');

let selectedOrigin = null;
let selectedDestination = null;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

originInput.addEventListener('input', (event) => {
  const query = event.target.value.trim();
  if (query.length < 2) {
    originDropdown.classList.add('hidden');
    selectedOrigin = null;
    updateSubmitButton();
    return;
  }
  lookupPlaceSuggestions(query, originDropdown, 'origin');
});

destinationInput.addEventListener('input', (event) => {
  const query = event.target.value.trim();
  if (query.length < 2) {
    destinationDropdown.classList.add('hidden');
    selectedDestination = null;
    updateSubmitButton();
    return;
  }
  lookupPlaceSuggestions(query, destinationDropdown, 'destination');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  resultCard.classList.add('hidden');

  if (!selectedOrigin || !selectedDestination) {
    showMessage('출발지와 도착지를 모두 선택해 주세요.');
    return;
  }

  try {
    const origin = selectedOrigin;
    const destination = selectedDestination;


    const distanceKm = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
    const formattedDistance = formatDistance(distanceKm);

    originText.textContent = origin.display_name;
    destinationText.textContent = destination.display_name;
    distanceText.textContent = formattedDistance;
    mapLink.href = buildOpenStreetMapLink(origin, destination);
    mapLink.textContent = '지도에서 보기';
    resultCard.classList.remove('hidden');
  } catch (error) {
    showMessage('조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    console.error(error);
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const R = 6371.0088;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(kilometers) {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }
  return `${kilometers.toFixed(2)} km`;
}

function buildOpenStreetMapLink(origin, destination) {
  const originCoords = `${origin.lat},${origin.lon}`;
  const destinationCoords = `${destination.lat},${destination.lon}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originCoords};${destinationCoords}`;
}

function showMessage(text) {
  message.textContent = text;
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('#origin-input') && !event.target.closest('#origin-dropdown')) {
    originDropdown.classList.add('hidden');
  }
  if (!event.target.closest('#destination-input') && !event.target.closest('#destination-dropdown')) {
    destinationDropdown.classList.add('hidden');
  }
});

function clearMessage() {
  message.textContent = '';
}

async function lookupPlaceSuggestions(query, dropdownElement, type) {
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '0');
    url.searchParams.set('accept-language', 'ko');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Nominatim 요청 실패: ${response.status}`);
    }

    const results = await response.json();
    
    dropdownElement.innerHTML = '';
    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = '검색 결과 없음';
      li.style.color = '#999';
      li.style.pointerEvents = 'none';
      dropdownElement.appendChild(li);
      dropdownElement.classList.remove('hidden');
      return;
    }

    results.forEach((result) => {
      const li = document.createElement('li');
      li.textContent = result.display_name;
      li.addEventListener('click', () => {
        selectPlace(result, type);
      });
      dropdownElement.appendChild(li);
    });

    dropdownElement.classList.remove('hidden');
  } catch (error) {
    console.error('자동완성 오류:', error);
    const li = document.createElement('li');
    li.textContent = '검색 중 오류 발생';
    li.style.color = '#999';
    li.style.pointerEvents = 'none';
    dropdownElement.innerHTML = '';
    dropdownElement.appendChild(li);
    dropdownElement.classList.remove('hidden');
  }
}

function selectPlace(place, type) {
  if (type === 'origin') {
    selectedOrigin = place;
    originInput.value = place.display_name;
    originDropdown.classList.add('hidden');
  } else if (type === 'destination') {
    selectedDestination = place;
    destinationInput.value = place.display_name;
    destinationDropdown.classList.add('hidden');
  }
  updateSubmitButton();
}

function updateSubmitButton() {
  if (selectedOrigin && selectedDestination) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}
