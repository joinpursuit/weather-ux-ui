
import { createIcons, CloudSun, Sun, CloudRain, CloudSnow, CloudFog, Cloud, CloudLightning, Moon, AlertTriangle } from 'lucide';
import { format, parseISO, addDays } from 'date-fns';

// Icon mapping based on WMO codes
const getWeatherIcon = (code) => {
  // WMO Weather interpretation codes (WW)
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  // 45, 48: Fog and depositing rime fog
  // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
  // 56, 57: Freezing Drizzle: Light and dense intensity
  // 61, 63, 65: Rain: Slight, moderate and heavy intensity
  // 66, 67: Freezing Rain: Light and heavy intensity
  // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
  // 77: Snow grains
  // 80, 81, 82: Rain showers: Slight, moderate, and violent
  // 85, 86: Snow showers slight and heavy
  // 95 *: Thunderstorm: Slight or moderate
  // 96, 99 *: Thunderstorm with slight and heavy hail

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

async function fetchWeather() {
  try {
    // Defaulting to New York for demo if geolocation fails or is denied.
    // In a real app, we'd ask for position first. 
    // Let's try to get position, with a fallback.
    let lat = 40.7128;
    let lon = -74.0060;

    const getPosition = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject('Geolocation not supported');
        } else {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      });
    };

    try {
      const position = await getPosition();
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch (e) {
      console.log('Using default location (New York)', e);
    }

    // Fetching data from Open-Meteo
    // Parameters:
    // current: temperature_2m, weather_code
    // hourly: temperature_2m, weather_code
    // daily: weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max
    // timezone: auto
    // forecasting_days: 10 (today + 9 days)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`;

    const response = await fetch(url);
    const data = await response.json();
    renderWeather(data);

  } catch (error) {
    console.error('Error fetching weather:', error);
    document.getElementById('condition-text').textContent = 'Error loading data';
  }
}

function renderWeather(data) {
  // Current Weather
  const current = data.current;
  const dailyToday = data.daily; // Arrays of data

  document.getElementById('current-temp').textContent = Math.round(current.temperature_2m);
  document.getElementById('condition-text').textContent = getWeatherDescription(current.weather_code);
  
  // Today's High/Low (Index 0)
  document.getElementById('temp-max').textContent = Math.round(dailyToday.temperature_2m_max[0]);
  document.getElementById('temp-min').textContent = Math.round(dailyToday.temperature_2m_min[0]);

  // Weather Alert (Mocking if no separate API for alerts is used, but implementation placeholder)
  // Open-Meteo doesn't provide alerts in the free tier easily without another endpoint. 
  // We'll leave it hidden unless we want to simulate one.
  // Example simulation:
  if (current.weather_code >= 95) { // Thunderstorm
    const alertEl = document.getElementById('weather-alert');
    alertEl.classList.remove('hidden');
    document.getElementById('alert-message').textContent = 'Severe Thunderstorm Warning';
  }

  // Hourly Forecast (Next 24 hours or just display a set amount)
  const hourlyContainer = document.getElementById('hourly-container');
  hourlyContainer.innerHTML = '';
  
  // Display next 24 hours
  const currentHourIndex = new Date().getHours();
  // We need to find the index in the hourly array that matches next hour
  // Open-Meteo returns hourly data starting from 00:00 today.
  
  for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
    if (!data.hourly.time[i]) break;
    
    const timeStr = data.hourly.time[i];
    const date = parseISO(timeStr);
    const hourFormatted = format(date, 'h a'); // e.g., 2 PM
    const temp = Math.round(data.hourly.temperature_2m[i]);
    const iconName = getWeatherIcon(data.hourly.weather_code[i]);
    
    const el = document.createElement('div');
    el.className = 'hourly-item';
    el.innerHTML = `
      <span class="hourly-time">${hourFormatted}</span>
      <i data-lucide="${iconName}" width="24" height="24"></i>
      <span class="hourly-temp">${temp}°</span>
    `;
    hourlyContainer.appendChild(el);
  }

  // 9-Day Forecast (starting from tomorrow, so index 1 to 9)
  const dailyContainer = document.getElementById('daily-container');
  dailyContainer.innerHTML = '';

  for (let i = 1; i < 10; i++) {
    if (!data.daily.time[i]) break; // Safety check

    const dateStr = data.daily.time[i];
    // Need to fix timezone issue when parsing ISO date for daily only (it's YYYY-MM-DD)
    // We can just append T00:00 to ensure local parsing or split it.
    // However, parseISO works well.
    const date = parseISO(dateStr); 
    const dayName = format(date, 'EEE'); // Mon, Tue...
    
    const min = Math.round(data.daily.temperature_2m_min[i]);
    const max = Math.round(data.daily.temperature_2m_max[i]);
    const precipProb = data.daily.precipitation_probability_max[i];
    const iconName = getWeatherIcon(data.daily.weather_code[i]);

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

  // Re-initialize icons for new elements
  initIcons();
}

// Initial fetch
fetchWeather();
