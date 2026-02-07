
import { createIcons, CloudSun, Sun, CloudRain, CloudSnow, CloudFog, Cloud, CloudLightning, Moon, AlertTriangle } from 'lucide';
import { format, parseISO, addDays } from 'date-fns';

// Icon mapping based on WMO codes
const getWeatherIcon = (code, isDay) => {
  // If night and clear/partly cloudy, show moon
  if (isDay === 0 && (code === 0 || code === 1 || code === 2)) return 'moon';

  if (code === 0) return 'sun';
  if (code >= 1 && code <= 3) return 'cloud-sun';
  if (code === 45 || code === 48) return 'cloud-fog';
  if (code >= 51 && code <= 67) return 'cloud-rain';
  if (code >= 71 && code <= 77) return 'cloud-snow';
  if (code >= 80 && code <= 82) return 'cloud-rain';
  if (code >= 85 && code <= 86) return 'cloud-snow';
  if (code >= 95) return 'cloud-lightning';
  return 'cloud';
};

const getWeatherDescription = (code) => {
  const descriptions = {
    0: 'Sunny',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Fog',
    51: 'Drizzle',
    53: 'Drizzle',
    55: 'Drizzle',
    56: 'Freezing Drizzle',
    57: 'Freezing Drizzle',
    61: 'Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    66: 'Freezing Rain',
    67: 'Freezing Rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Rain Showers',
    81: 'Rain Showers',
    82: 'Violent Rain',
    85: 'Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Heavy Thunderstorm'
  };
  return descriptions[code] || 'Unknown';
};

// Initialize Lucide icons
const initIcons = () => {
  createIcons({
    icons: {
      Sun, CloudSun, CloudRain, CloudSnow, CloudFog, Cloud, CloudLightning, Moon, AlertTriangle
    }
  });
};

function updateBackground(code, isDay) {
  const body = document.body;
  body.className = ''; // Reset classes

  // Check if night
  if (isDay === 0) {
    body.classList.add('bg-night');
    return;
  }

  // Day time mapping
  if (code === 0 || code === 1) body.classList.add('bg-sunny');
  else if (code <= 3) body.classList.add('bg-cloudy');
  else if (code <= 48) body.classList.add('bg-fog');
  else if (code <= 67 || code >= 80) {
    body.classList.add('bg-rain');
    // Add extra clouds for rain
    addClouds(10);
  }
  else if (code <= 77 || code === 85 || code === 86) body.classList.add('bg-snow');
  else if (code >= 95) body.classList.add('bg-rain'); // Thunderstorm
  else body.classList.add('bg-cloudy');
}


function addClouds(count = 6) {
  const container = document.getElementById('cloud-container');
  // Clear existing if any (optional, but good for reset)
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const cloud = document.createElement('div');
    cloud.classList.add('cloud');

    // Randomize properties for "gas" look
    const top = Math.random() * 60; // Spread vertically more
    const duration = 40 + Math.random() * 40; // Slower: 40s - 80s
    const delay = Math.random() * -50;

    // Make them much wider than tall for "stratus" or gas layers
    const width = 300 + Math.random() * 300; // 300px - 600px wide
    const height = 100 + Math.random() * 100; // 100px - 200px tall
    const opacity = 0.2 + Math.random() * 0.3; // Lower opacity for gas effect

    cloud.style.top = `${top}%`;
    cloud.style.animationDuration = `${duration}s`;
    cloud.style.animationDelay = `${delay}s`;
    cloud.style.width = `${width}px`;
    cloud.style.height = `${height}px`;
    cloud.style.opacity = opacity;

    container.appendChild(cloud);
  }
}



let currentUnit = 'C'; // 'C' or 'F'
let weatherData = null; // Store fetched data

function toF(celsius) {
  return (celsius * 9 / 5) + 32;
}

function getTemp(celsius) {
  if (currentUnit === 'F') {
    return Math.round(toF(celsius));
  }
  return Math.round(celsius);
}

function updateUnitUI() {
  const btnC = document.getElementById('btn-c');
  const btnF = document.getElementById('btn-f');
  if (currentUnit === 'C') {
    btnC.classList.add('active');
    btnF.classList.remove('active');
  } else {
    btnC.classList.remove('active');
    btnF.classList.add('active');
  }

  // Re-render if data exists
  if (weatherData) {
    renderWeather(weatherData);
  }
}

// Event Listeners for Unit Toggle
document.getElementById('btn-c').addEventListener('click', () => {
  if (currentUnit !== 'C') {
    currentUnit = 'C';
    updateUnitUI();
  }
});


function updateClock() {
  const now = new Date();
  document.getElementById('time-display').textContent = format(now, 'h:mm a');
}

setInterval(updateClock, 1000);
updateClock(); // Initial call

document.getElementById('btn-f').addEventListener('click', () => {
  if (currentUnit !== 'F') {
    currentUnit = 'F';
    updateUnitUI();
  }
});


async function fetchCity(lat, lon) {
  try {
    // Use Nominatim (OpenStreetMap) - has better CORS support than Open-Meteo geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`API response status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Nominatim response:', data);
    
    if (data.address) {
      // Try to get city name from various properties
      const address = data.address;
      const cityName = 
        address.city || 
        address.town || 
        address.village || 
        address.county || 
        address.state || 
        'Unknown Location';
      
      console.log('City name fetched:', cityName);
      document.querySelector('.city-name').textContent = cityName;
    } else {
      console.warn('No address in nominatim response');
      document.querySelector('.city-name').textContent = 'Unknown Location';
    }
  } catch (e) {
    console.error('Error fetching city:', e);
    document.querySelector('.city-name').textContent = 'Unable to Load City';
  }
}


async function fetchWeather() {
  const cityEl = document.querySelector('.city-name');
  const conditionEl = document.getElementById('condition-text');

  // Show loading
  cityEl.textContent = 'Locating...';
  conditionEl.textContent = 'Please wait...';

  try {
    let lat = 40.7128; // Default: New York
    let lon = -74.0060;
    let usingDefault = false;

    const getPosition = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
        } else {
          // Timeout after 5 seconds
          const timeout = setTimeout(() => {
            reject(new Error('Location timeout'));
          }, 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeout);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeout);
              reject(err);
            }
          );
        }
      });
    };

    try {
      const position = await getPosition();
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch (e) {
      console.warn('GPS failed or denied, using default:', e);
      usingDefault = true;
      // If we could determine the approximate location via IP in a real app, we'd do that here.
      // For now, defaulting to New York but updating UI to reflect that.
    }

    // Fetch City Name
    cityEl.textContent = 'Fetching city...';
    await fetchCity(lat, lon); // fetchCity updates the DOM directly

    // Fetch Weather
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`;

    const response = await fetch(url);
    const data = await response.json();
    weatherData = data; // Store data globally
    renderWeather(data);

    if (usingDefault) {
      // Optional: Notify user we are using default location
      // But for now, we just show the city name of the default location (New York)
      console.log('Displayed default location weather');
    }

  } catch (error) {
    console.error('Error fetching weather:', error);
    conditionEl.textContent = 'Error loading data';
    cityEl.textContent = 'Error';
  }
}


function renderWeather(data) {
  const current = data.current;
  const dailyToday = data.daily;

  console.log('Weather Data:', data);

  // Update Background & Clouds
  updateBackground(current.weather_code, current.is_day);
  // Re-init clouds if not rain (rain adds its own, but we want clouds always)
  if (!(current.weather_code <= 67 && current.weather_code >= 51) && !(current.weather_code >= 80)) {
    addClouds(5);
  }

  document.getElementById('current-temp').textContent = getTemp(current.temperature_2m);
  // Update degree symbol in display if needed, but usually just number changes and symbol stays
  // However, usually "C" or "F" isn't explicitly shown next to big number in some designs, but here we have a degree symbol. 
  // Let's assume just updating the number is enough as the toggle shows the unit.

  document.getElementById('condition-text').textContent = getWeatherDescription(current.weather_code);

  document.getElementById('temp-max').textContent = getTemp(dailyToday.temperature_2m_max[0]);
  document.getElementById('temp-min').textContent = getTemp(dailyToday.temperature_2m_min[0]);

  if (current.weather_code >= 95) {
    const alertEl = document.getElementById('weather-alert');
    alertEl.classList.remove('hidden');
    document.getElementById('alert-message').textContent = 'Severe Thunderstorm Warning';
  }

  // Hourly
  const hourlyContainer = document.getElementById('hourly-container');
  hourlyContainer.innerHTML = '';

  const currentHourIndex = new Date().getHours();
  let startIndex = currentHourIndex;

  for (let i = startIndex; i < startIndex + 24; i++) {
    if (!data.hourly.time[i]) break;

    const timeStr = data.hourly.time[i];
    const date = parseISO(timeStr);
    const hourFormatted = format(date, 'h a');
    const temp = getTemp(data.hourly.temperature_2m[i]);
    const isDayHourly = data.hourly.is_day[i];
    const iconName = getWeatherIcon(data.hourly.weather_code[i], isDayHourly);

    const el = document.createElement('div');
    el.className = 'hourly-item';
    el.innerHTML = `
      <span class="hourly-time">${hourFormatted}</span>
      <i data-lucide="${iconName}" width="24" height="24"></i>
      <span class="hourly-temp">${temp}°</span>
    `;
    hourlyContainer.appendChild(el);
  }

  // Daily
  const dailyContainer = document.getElementById('daily-container');
  dailyContainer.innerHTML = '';

  for (let i = 1; i < 10; i++) {
    if (!data.daily.time[i]) break;

    const dateStr = data.daily.time[i];
    const date = parseISO(dateStr);
    const dayName = format(date, 'EEE');

    const min = getTemp(data.daily.temperature_2m_min[i]);
    const max = getTemp(data.daily.temperature_2m_max[i]);
    const precipProb = data.daily.precipitation_probability_max[i];
    const iconName = getWeatherIcon(data.daily.weather_code[i], 1);

    const el = document.createElement('div');
    el.className = 'daily-item';
    el.innerHTML = `
      <span class="day-name">${dayName}</span>
      <div class="daily-icon-prob">
        <i data-lucide="${iconName}" width="24" height="24"></i>
        <span class="precip-prob">${precipProb > 0 ? precipProb + '%' : ''}</span>
      </div>
      <div class="daily-temps">
        <span class="temp-high">${max}°</span>
        <span class="temp-low">${min}°</span>
      </div>
    `;
    dailyContainer.appendChild(el);
  }

  initIcons();
}

fetchWeather();

