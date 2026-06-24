const form = document.getElementById('route-form');
const originInput = document.getElementById('origin-input');
const destinationInput = document.getElementById('destination-input');
const originText = document.getElementById('origin-text');
const destinationText = document.getElementById('destination-text');
const distanceText = document.getElementById('distance-text');
const mapLink = document.getElementById('map-link');
const resultCard = document.getElementById('result-card');
const message = document.getElementById('message');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  resultCard.classList.add('hidden');

  const originQuery = originInput.value.trim();
  const destinationQuery = destinationInput.value.trim();

  if (!originQuery || !destinationQuery) {
    showMessage('출발지와 도착지를 모두 입력해 주세요.');
    return;
  }

  try {
    const [origin, destination] = await Promise.all([
      lookupPlace(originQuery),
      lookupPlace(destinationQuery),
    ]);

    if (!origin) {
      showMessage('출발지를 찾을 수 없습니다. 다른 이름을 입력해 주세요.');
      return;
    }
    if (!destination) {
      showMessage('도착지를 찾을 수 없습니다. 다른 이름을 입력해 주세요.');
      return;
    }

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

async function lookupPlace(query) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');
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
  return results && results.length ? results[0] : null;
}

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

function clearMessage() {
  message.textContent = '';
}
