const state = {
  date: "",
  time: "17:00",
  foods: [],
  activities: [],
};

const screens = [...document.querySelectorAll(".screen")];
const toast = document.getElementById("toast");
const declineBtn = document.getElementById("declineBtn");
const inviteText = document.getElementById("inviteText");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const musicToggle = document.getElementById("musicToggle");
const bgmAudio = document.getElementById("bgmAudio");
let musicPlaying = false;
let synthContext;
let synthBus;
let synthTimer;
let usingSynthBgm = false;

function show(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1400);
}

async function startBgm({ silent = false } = {}) {
  if (musicPlaying) return;
  if (bgmAudio) {
    try {
      bgmAudio.volume = 0.42;
      await bgmAudio.play();
      setMusicPlaying(false);
      return;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        if (!silent) showToast("浏览器拦截了自动播放，点一下页面就会播放");
        return;
      }
    }
  }
  try {
    await startSynthBgm();
    setMusicPlaying(true);
  } catch (error) {
    if (!silent) showToast("点一下页面就会播放 BGM");
  }
}

function setMusicPlaying(isSynth) {
  usingSynthBgm = isSynth;
  musicPlaying = true;
  musicToggle.classList.add("playing");
  musicToggle.textContent = "♫";
}

function stopBgm() {
  if (!musicPlaying) return;
  musicPlaying = false;
  if (bgmAudio) bgmAudio.pause();
  stopSynthBgm();
  musicToggle.classList.remove("playing");
  musicToggle.textContent = "♪";
}

async function startSynthBgm() {
  synthContext ||= new (window.AudioContext || window.webkitAudioContext)();
  await synthContext.resume();
  if (!synthBus) {
    synthBus = synthContext.createGain();
    const filter = synthContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1450;
    synthBus.gain.value = 0.22;
    synthBus.connect(filter).connect(synthContext.destination);
  }
  scheduleSynthPhrase(synthContext.currentTime + 0.05);
  synthTimer = window.setInterval(() => scheduleSynthPhrase(synthContext.currentTime + 0.05), 7600);
}

function stopSynthBgm() {
  window.clearInterval(synthTimer);
}

function playSynthTone(freq, start, duration, gain = 0.035) {
  const oscillator = synthContext.createOscillator();
  const toneGain = synthContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(freq, start);
  toneGain.gain.setValueAtTime(0.0001, start);
  toneGain.gain.linearRampToValueAtTime(gain, start + 0.08);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(toneGain).connect(synthBus);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.12);
}

function scheduleSynthPhrase(start) {
  const chords = [
    [261.63, 329.63, 392.0],
    [220.0, 329.63, 392.0],
    [246.94, 293.66, 369.99],
    [196.0, 293.66, 349.23],
  ];
  chords.forEach((chord, index) => {
    const t = start + index * 1.9;
    chord.forEach((freq, noteIndex) => playSynthTone(freq, t + noteIndex * 0.04, 1.55));
    playSynthTone(chord[2] * 2, t + 0.82, 0.52, 0.018);
  });
}

musicToggle.addEventListener("click", () => {
  if (musicPlaying) {
    stopBgm();
  } else {
    startBgm();
  }
});

function armAutoplayFallback() {
  const resume = (event) => {
    if (event.target.closest("#musicToggle")) return;
    startBgm({ silent: true });
  };
  document.addEventListener("pointerdown", resume, { once: true });
  document.addEventListener("keydown", resume, { once: true });
}

window.addEventListener("load", () => {
  startBgm({ silent: true });
  armAutoplayFallback();
});

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.next));
});

document.getElementById("acceptBtn").addEventListener("click", () => {
  inviteText.textContent = "太好了，约会计划已启动";
  startBgm();
  show("screen-time");
});

let escapes = 0;
function runAwayDecline() {
  if (escapes > 9) return;
  escapes += 1;
  const rangeX = Math.min(window.innerWidth * 0.34, 430);
  const rangeY = Math.min(window.innerHeight * 0.24, 250);
  const x = (Math.random() > 0.5 ? 1 : -1) * (rangeX * (0.42 + Math.random() * 0.58));
  const y = (Math.random() > 0.5 ? 1 : -1) * (rangeY * (0.34 + Math.random() * 0.66));
  declineBtn.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 14 - 7}deg)`;
}

declineBtn.addEventListener("mouseenter", runAwayDecline);
declineBtn.addEventListener("focus", runAwayDecline);

declineBtn.addEventListener("click", () => {
  runAwayDecline();
  showToast("这个按钮会逃跑 😝");
});

function weatherMeta(code) {
  if (code === 0) return ["晴天", "☀️", "sun"];
  if ([1, 2, 3].includes(code)) return ["多云", "⛅", "cloud"];
  if ([45, 48].includes(code)) return ["有雾", "🌫️", "cloud"];
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["小雨转多云", "🌧️", "rain"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["有雪", "🌨️", "snow"];
  if ([95, 96, 99].includes(code)) return ["雷雨", "⛈️", "storm"];
  return ["天气变化", "🌤️", "cloud"];
}

function setWeatherClass(type) {
  const card = document.getElementById("screen-weather");
  card.classList.remove("weather-rain", "weather-sun", "weather-cloud", "weather-snow", "weather-storm");
  card.classList.add(`weather-${type}`);
}

function makeFx(type) {
  const fx = document.getElementById("weatherFx");
  fx.innerHTML = "";
  setWeatherClass(type);

  if (type === "rain" || type === "storm") {
    for (let i = 0; i < 44; i += 1) {
      const drop = document.createElement("i");
      drop.className = "drop";
      drop.style.left = `${Math.random() * 100}%`;
      drop.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
      drop.style.animationDelay = `${-Math.random() * 2}s`;
      fx.append(drop);
    }
  }

  if (type === "snow") {
    for (let i = 0; i < 36; i += 1) {
      const snow = document.createElement("i");
      snow.className = "snow";
      snow.textContent = "❄";
      snow.style.left = `${Math.random() * 100}%`;
      snow.style.animationDuration = `${3 + Math.random() * 4}s`;
      snow.style.animationDelay = `${-Math.random() * 4}s`;
      fx.append(snow);
    }
  }

  if (type === "sun") {
    const sun = document.createElement("i");
    sun.className = "sun-ray";
    fx.append(sun);
  }

  if (type === "storm") {
    const bolt = document.createElement("i");
    bolt.className = "lightning";
    bolt.textContent = "⚡";
    fx.append(bolt);
  }
}

async function loadWeather() {
  const selectedDate = state.date || dateInput.value;
  document.getElementById("weatherTitle").textContent = `${formatDate(selectedDate)} 天气预报`;
  makeFx("rain");
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5500 });
    });
    const { latitude, longitude } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=apparent_temperature,relative_humidity_2m,wind_speed_10m&start_date=${selectedDate}&end_date=${selectedDate}&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("weather request failed");
    const data = await response.json();
    const [label, icon, type] = weatherMeta(data.daily.weather_code[0]);
    const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
    const minTemp = Math.round(data.daily.temperature_2m_min[0]);
    const feels = Math.round(average(data.hourly.apparent_temperature));
    const humidity = Math.round(average(data.hourly.relative_humidity_2m));
    const wind = Math.round(Math.max(...data.hourly.wind_speed_10m));
    const rainChance = Math.round(data.daily.precipitation_probability_max[0] ?? 0);
    document.getElementById("weatherIcon").textContent = icon;
    document.getElementById("weatherEmoji").textContent = icon;
    document.getElementById("weatherLabel").textContent = label;
    document.getElementById("weatherTemp").textContent = `${minTemp}-${maxTemp}°C`;
    document.getElementById("weatherFeels").textContent = `${feels}°C`;
    document.getElementById("weatherHumidity").textContent = `${humidity}%`;
    document.getElementById("weatherWind").textContent = `${wind}km/h`;
    document.getElementById("weatherAir").textContent = `${rainChance}%`;
    makeFx(type);
  } catch (error) {
    document.getElementById("weatherIcon").textContent = "🌧️";
    document.getElementById("weatherEmoji").textContent = "🌧️";
    document.getElementById("weatherLabel").textContent = "小雨转多云";
    document.getElementById("weatherTemp").textContent = "22°C";
    document.getElementById("weatherFeels").textContent = "20°C";
    document.getElementById("weatherHumidity").textContent = "78%";
    document.getElementById("weatherWind").textContent = "12km/h";
    document.getElementById("weatherAir").textContent = "65%";
    makeFx("rain");
  }
}

function average(values) {
  const usable = values.filter((value) => Number.isFinite(value));
  if (!usable.length) return 0;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function formatDate(value) {
  if (!value) return "待定";
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日（周${"日一二三四五六"[date.getDay()]}）`;
}

function updateFinal() {
  document.getElementById("finalDate").textContent = formatDate(state.date);
  document.getElementById("finalTime").textContent = state.time || "待定";
  document.getElementById("finalFood").textContent = state.foods.length ? state.foods.join(", ") : "还没选";
  document.getElementById("finalActivity").textContent = state.activities.length ? state.activities.join(", ") : "还没选";
}

function buildPlanText() {
  const weather = [
    document.getElementById("weatherLabel").textContent,
    document.getElementById("weatherTemp").textContent,
  ].filter(Boolean).join(" ");
  return [
    "阿阳，我选好啦！",
    `日期：${document.getElementById("finalDate").textContent}`,
    `时间：${document.getElementById("finalTime").textContent}`,
    `天气：${weather || "待定"}`,
    `想吃：${document.getElementById("finalFood").textContent}`,
    `想做：${document.getElementById("finalActivity").textContent}`,
  ].join("\n");
}

async function sendPlan() {
  const text = buildPlanText();
  if (navigator.share) {
    try {
      await navigator.share({ title: "刘乐乐的约会计划", text });
      showToast("计划发出去啦 💌");
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("约会计划已复制，发给阿阳就好啦");
  } catch (error) {
    showToast("复制失败，可以截图发给阿阳");
  }
}

document.getElementById("timeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.date = dateInput.value;
  state.time = timeInput.value;
  updateFinal();
  show("screen-weather");
  loadWeather();
});

function setupChoice({ gridId, attr, stateKey, inputId, addId, nextId, nextScreen }) {
  const grid = document.getElementById(gridId);
  const input = document.getElementById(inputId);
  const next = document.getElementById(nextId);

  function syncFromButtons() {
    const buttonValues = [...grid.querySelectorAll(`button[${attr}].selected`)].map((button) => button.getAttribute(attr));
    const customValues = state[stateKey].filter((value) => !grid.querySelector(`button[${attr}="${value}"]`));
    state[stateKey] = [...buttonValues, ...customValues];
    next.disabled = state[stateKey].length === 0;
    updateFinal();
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(`button[${attr}]`);
    if (!button) return;
    button.classList.toggle("selected");
    syncFromButtons();
  });

  document.getElementById(addId).addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    if (!state[stateKey].includes(value)) state[stateKey].push(value);
    input.value = "";
    next.disabled = false;
    updateFinal();
    showToast(`已加入：${value}`);
  });

  next.addEventListener("click", () => {
    if (!state[stateKey].length) return;
    if (nextScreen) {
      show(nextScreen);
    } else {
      show("screen-final");
    }
  });
}

const tomorrow = new Date(Date.now() + 86400000);
dateInput.min = new Date().toISOString().split("T")[0];
dateInput.value = tomorrow.toISOString().split("T")[0];
state.date = dateInput.value;

setupChoice({
  gridId: "foodGrid",
  attr: "data-food",
  stateKey: "foods",
  inputId: "customFood",
  addId: "useCustomFood",
  nextId: "foodNext",
  nextScreen: "screen-activity",
});

setupChoice({
  gridId: "activityGrid",
  attr: "data-activity",
  stateKey: "activities",
  inputId: "customActivity",
  addId: "useCustomActivity",
  nextId: "activityNext",
});

document.getElementById("restartBtn").addEventListener("click", () => {
  state.foods = [];
  state.activities = [];
  document.querySelectorAll(".selected").forEach((button) => button.classList.remove("selected"));
  document.getElementById("foodNext").disabled = true;
  document.getElementById("activityNext").disabled = true;
  declineBtn.style.transform = "";
  escapes = 0;
  updateFinal();
  show("screen-intro");
});

document.getElementById("sendPlanBtn").addEventListener("click", sendPlan);

updateFinal();
makeFx("rain");
