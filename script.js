
"use strict";

/* DOMINIO DEL TECLADO - KEYMASTER ACADEMY */

const $ = id => document.getElementById(id);
const STORAGE_KEY = "keymasterAcademy_v3";

const defaultData = {
  coins: 0,
  xp: 0,
  games: 0,
  record: 0,
  bestPPM: 0,
  totalHits: 0,
  totalAccuracy: 0,
  accuracyCount: 0,
  selectedPet: 0,
  ownedPets: [0],
  achievements: [],
  daily: {
    date: new Date().toLocaleDateString("en-CA"),
    games: 0,
    hits: 0,
    accuracy: 0,
    phrases: 0,
    claimed: []
  },
  history: []
};

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultData);

    return {
      ...structuredClone(defaultData),
      ...saved,
      daily: { ...defaultData.daily, ...(saved.daily || {}) },
      ownedPets: Array.isArray(saved.ownedPets) ? saved.ownedPets : [0],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      history: Array.isArray(saved.history) ? saved.history : []
    };
  } catch {
    return structuredClone(defaultData);
  }
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function checkNewDay() {
  const today = new Date().toLocaleDateString("en-CA");
  if (data.daily.date !== today) {
    data.daily = {
      date: today,
      games: 0,
      hits: 0,
      accuracy: 0,
      phrases: 0,
      claimed: []
    };
    saveData();
  }
}

checkNewDay();

/* MASCOTAS: 50 COMPAÑEROS */

const pets = [
  ["León","🦁",0],["Gato","🐱",30],["Perro","🐶",40],["Zorro","🦊",50],
  ["Panda","🐼",60],["Tigre","🐯",70],["Conejo","🐰",80],["Oso","🐻",90],
  ["Koala","🐨",100],["Mono","🐵",110],["Lobo","🐺",120],["Rana","🐸",130],
  ["Pingüino","🐧",140],["Águila","🦅",150],["Búho","🦉",160],["Delfín","🐬",170],
  ["Tortuga","🐢",180],["Dragón","🐉",190],["Unicornio","🦄",200],["Caballo","🐴",210],
  ["Elefante","🐘",220],["Jirafa","🦒",230],["Cocodrilo","🐊",240],["Serpiente","🐍",250],
  ["Pulpo","🐙",260],["Ballena","🐳",270],["Tiburón","🦈",280],["Mariposa","🦋",290],
  ["Abeja","🐝",300],["Caracol","🐌",310],["Murciélago","🦇",320],["Ciervo","🦌",330],
  ["Camello","🐫",340],["Gorila","🦍",350],["Flamenco","🦩",360],["Pavo real","🦚",370],
  ["Loro","🦜",380],["Cisne","🦢",390],["Ratón","🐭",400],["Hámster","🐹",410],
  ["Pato","🦆",420],["Gallina","🐔",430],["Carnero","🐏",440],["Búfalo","🐃",450],
  ["Estegosaurio","🦕",460],["Tiranosaurio","🦖",470],["Alienígena","👽",480],
  ["Robot","🤖",490],["Fantasma","👻",500],["Gato espacial","😺",550]
];

/* EJERCICIOS */

const exercises = {
  basico: {
    palabras: ["casa","mesa","luna","gato","perro","libro","flor","mano","sol","nube","árbol","niño","juego","tecla","silla","ratón","puerta","papel","lápiz","escuela"],
    frases: ["El sol brilla.","Me gusta leer.","La luna sale de noche.","Hoy es un gran día.","Mi casa es bonita.","Aprendo con alegría."],
    numeros: ["12345","98765","2026","24680","13579","112233","556677"]
  },
  intermedio: {
    palabras: ["teclado","velocidad","precisión","aventura","computadora","aprendizaje","escritura","biblioteca","mariposa","naturaleza","conocimiento","estudiante"],
    frases: ["Practico todos los días para mejorar.","La precisión es importante al escribir.","Aprender jugando es divertido.","Mi objetivo es dominar el teclado.","Cada desafío me ayuda a mejorar."],
    numeros: ["123456789","20262026","987654321","135792468","1122334455"]
  },
  avanzado: {
    palabras: ["extraordinario","responsabilidad","desarrollador","concentración","extraordinariamente","perseverancia","programación","transformación"],
    frases: ["La práctica constante fortalece nuestras habilidades digitales.","Es importante escribir correctamente y mantener la concentración.","La tecnología nos permite aprender cosas extraordinarias.","La velocidad sin precisión no garantiza un buen resultado."],
    numeros: ["123456789012","987654321098","202611171234","314159265358","112233445566"]
  }
};

const lifeSettings = { basico: 2, intermedio: 3, avanzado: 1 };

let game = {
  active: false,
  lives: 2,
  time: 60,
  score: 0,
  hits: 0,
  mistakes: 0,
  typed: 0,
  startedAt: 0,
  timer: null,
  pool: [],
  target: "",
  spun: false,
  roundPhrases: 0,
  roundHits: 0
};

let audioContext = null;
let musicTimer = null;
let musicOn = false;
let noteIndex = 0;

/* SONIDOS */

function playTone(frequency = 440, duration = 0.12, type = "sine") {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("El audio no está disponible en este navegador.", error);
  }
}

function soundCorrect() {
  playTone(660, 0.1);
  setTimeout(() => playTone(880, 0.12), 90);
}

function soundWrong() {
  playTone(180, 0.2, "triangle");
}

function toggleMusic() {
  musicOn = !musicOn;

  if (musicOn) {
    $("musicBtn").textContent = "🔇 Detener música";
    playTone(440, 0.2);

    const melody = [392, 440, 523, 440, 349, 392, 494, 392];
    musicTimer = setInterval(() => {
      if (musicOn) {
        playTone(melody[noteIndex % melody.length], 0.18, "sine");
        noteIndex++;
      }
    }, 450);
  } else {
    clearInterval(musicTimer);
    $("musicBtn").textContent = "🔊 Activar música";
  }
}

/* NAVEGACIÓN */

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    inicio: "¡Bienvenido, estudiante!",
    entrenamiento: "Zona de entrenamiento",
    mapa: "Mapa de aventuras",
    misiones: "Misiones diarias",
    mascotas: "Colección de mascotas",
    ranking: "Ranking de jugadores",
    logros: "Trofeos y recompensas",
    estadisticas: "Tus estadísticas"
  };

  $("pageTitle").textContent = titles[page] || "Keymaster Academy";
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

/* PANEL PRINCIPAL */

function getRank() {
  if (data.xp >= 2000) return "Maestro legendario";
  if (data.xp >= 1000) return "Experto";
  if (data.xp >= 500) return "Avanzado";
  if (data.xp >= 200) return "Intermedio";
  return "Principiante";
}

function renderDashboard() {
  $("coins").textContent = data.coins;
  $("xp").textContent = data.xp + " XP";
  $("record").textContent = data.record;
  $("games").textContent = data.games;
  $("levelName").textContent = getRank();

  const progress = data.xp % 100;
  $("homeProgress").style.width = progress + "%";
  $("progressText").textContent = progress + " / 100 XP para el siguiente rango";

  const pet = pets[data.selectedPet] || pets[0];
  $("homePet").textContent = pet[1];

  $("bestPPM").textContent = data.bestPPM;
  $("averageAccuracy").textContent = data.accuracyCount
    ? Math.round(data.totalAccuracy / data.accuracyCount) + "%"
    : "0%";
  $("totalHits").textContent = data.totalHits;
  $("totalGames").textContent = data.games;

  renderMap();
  renderMissions();
  renderPets();
  renderRanking();
  renderAchievements();
}

function renderMap() {
  const completed = data.games;
  [1, 5, 10, 20].forEach((required, index) => {
    $("world" + (index + 1)).classList.toggle("unlocked", completed >= required);
  });
}

/* PARTIDAS */

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makePool() {
  const difficulty = $("difficulty").value;
  const type = $("exerciseType").value;
  const source = exercises[difficulty];

  let result = [];

  if (type === "mixto") {
    result = [...source.palabras, ...source.frases, ...source.numeros];
  } else {
    result = [...source[type]];
  }

  return shuffle(result);
}

function nextTarget() {
  if (!game.active) return;

  if (game.pool.length === 0) {
    game.pool = makePool();
  }

  game.target = game.pool.pop();
  $("target").textContent = game.target;
  $("typingInput").value = "";
  $("typingInput").focus();
  $("feedback").textContent = "¡Escribe el texto que aparece arriba!";
  $("feedback").className = "";
}

function updateGameDisplay() {
  $("lives").textContent = game.lives;
  $("time").textContent = game.time;
  $("score").textContent = game.score;
  $("hits").textContent = game.hits;
  $("ppm").textContent = getCurrentPPM();
  $("accuracy").textContent = getAccuracy() + "%";
}

function startGame() {
  clearInterval(game.timer);

  game = {
    active: true,
    lives: lifeSettings[$("difficulty").value],
    time: 60,
    score: 0,
    hits: 0,
    mistakes: 0,
    typed: 0,
    startedAt: Date.now(),
    timer: null,
    pool: makePool(),
    target: "",
    spun: false,
    roundPhrases: 0,
    roundHits: 0
  };

  $("spinBtn").disabled = true;
  $("spinResult").textContent = "¡Consigue premios!";
  $("typingInput").disabled = false;
  $("startBtn").disabled = true;
  $("typingInput").focus();

  nextTarget();
  updateGameDisplay();

  game.timer = setInterval(() => {
    if (!game.active) return;
    game.time--;
    updateGameDisplay();

    if (game.time <= 0) finishGame("¡Se terminó el tiempo!");
  }, 1000);
}

function restartGame() {
  clearInterval(game.timer);
  game.active = false;
  game.lives = lifeSettings[$("difficulty").value];
  game.time = 60;
  game.score = 0;
  game.hits = 0;
  game.mistakes = 0;
  game.typed = 0;

  $("typingInput").value = "";
  $("typingInput").disabled = true;
  $("target").textContent = "Presiona comenzar";
  $("feedback").textContent = "¡Prepárate para tu próxima partida!";
  $("feedback").className = "";
  $("startBtn").disabled = false;

  updateGameDisplay();
}

function getCurrentPPM() {
  const elapsed = Math.max(1, (Date.now() - game.startedAt) / 60000);
  return game.startedAt ? Math.round(game.hits / elapsed) : 0;
}

function getAccuracy() {
  const total = game.hits + game.mistakes;
  return total ? Math.round((game.hits / total) * 100) : 100;
}

function handleTyping() {
  if (!game.active) return;

  const value = $("typingInput").value;
  const target = game.target;

  game.typed = Math.max(game.typed, value.length);

  if (target.startsWith(value)) {
    $("feedback").textContent = "¡Vas muy bien! Sigue escribiendo.";
    $("feedback").className = "correct";
  } else {
    $("feedback").textContent = "Revisa las letras e inténtalo de nuevo.";
    $("feedback").className = "incorrect";
  }

  if (value === target) {
    game.hits++;
    game.roundHits++;
    game.score += target.length * 10;
    game.time = Math.min(60, game.time + 1);

    if (target.includes(" ")) game.roundPhrases++;

    soundCorrect();
    updateGameDisplay();
    nextTarget();
  }
}

function handleWrongKey() {
  if (!game.active) return;

  game.mistakes++;
  game.lives--;

  soundWrong();
  $("feedback").textContent = "¡Esa tecla no corresponde! Inténtalo otra vez.";
  $("feedback").className = "incorrect";

  updateGameDisplay();

  if (game.lives <= 0) {
    finishGame("¡Te has quedado sin vidas!");
  }
}

function finishGame(message) {
  if (!game.active) return;

  game.active = false;
  clearInterval(game.timer);

  $("typingInput").disabled = true;
  $("startBtn").disabled = false;

  const accuracy = getAccuracy();
  const ppm = getCurrentPPM();
  const earnedCoins = Math.max(1, Math.floor(game.score / 100));
  const earnedXP = Math.max(5, Math.floor(game.score / 20));

  data.games++;
  data.coins += earnedCoins;
  data.xp += earnedXP;
  data.record = Math.max(data.record, game.score);
  data.bestPPM = Math.max(data.bestPPM, ppm);
  data.totalHits += game.hits;
  data.totalAccuracy += accuracy;
  data.accuracyCount++;
  data.daily.games++;
  data.daily.hits += game.hits;
  data.daily.accuracy = Math.max(data.daily.accuracy, accuracy);
  data.daily.phrases += game.roundPhrases;

  data.history.push({
    score: game.score,
    ppm,
    accuracy,
    date: new Date().toLocaleDateString("es-PE")
  });

  data.history = data.history.slice(-10);

  updateMissions();
  checkAchievements();
  saveData();
  renderDashboard();

  $("resultIcon").textContent = game.score > 0 ? "🏆" : "💪";
  $("resultTitle").textContent = "¡Partida terminada!";
  $("resultText").textContent =
    message + " Puntos: " + game.score +
    " · PPM: " + ppm +
    " · Precisión: " + accuracy + "%" +
    " · Monedas ganadas: " + earnedCoins;

  $("resultModal").classList.add("show");
  $("spinBtn").disabled = false;
}

$("typingInput").addEventListener("input", handleTyping);

$("typingInput").addEventListener("keydown", event => {
  if (!game.active) return;

  if (event.key === "Backspace") {
    // Permite corregir lo escrito sin perder una vida.
    return;
  }

  if (event.key.length === 1) {
    const expected = game.target[$("typingInput").value.length];

    if (event.key !== expected) {
      event.preventDefault();
      handleWrongKey();
    }
  }
});

$("typingInput").addEventListener("paste", event => event.preventDefault());
$("typingInput").addEventListener("copy", event => event.preventDefault());
$("typingInput").addEventListener("cut", event => event.preventDefault());
$("typingInput").addEventListener("drop", event => event.preventDefault());

$("typingInput").addEventListener("contextmenu", event => event.preventDefault());

document.addEventListener("keydown", event => {
  const typing = event.target === $("typingInput");

  if (typing && (event.ctrlKey || event.metaKey) &&
      ["c", "v", "x"].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }
});

$("startBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", restartGame);

$("closeModal").addEventListener("click", () => {
  $("resultModal").classList.remove("show");
});

$("resultModal").addEventListener("click", event => {
  if (event.target === $("resultModal")) {
    $("resultModal").classList.remove("show");
  }
});

/* LECTURA EN VOZ ALTA */

$("speakBtn").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    $("feedback").textContent = "Tu navegador no admite lectura en voz alta.";
    return;
  }

  const text = game.active ? game.target : $("target").textContent;
  const speech = new SpeechSynthesisUtterance(text);

  speech.lang = "es-ES";
  speech.rate = Number($("voiceSpeed").value);
  speech.pitch = 1;

  speechSynthesis.cancel();
  speechSynthesis.speak(speech);
});

/* MODO CLARO Y OSCURO */

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");

  $("themeBtn").textContent = dark ? "☀️ Modo claro" : "🌙 Modo oscuro";
  localStorage.setItem("keymasterTheme", dark ? "dark" : "light");
});

if (localStorage.getItem("keymasterTheme") === "dark") {
  document.body.classList.add("dark");
  $("themeBtn").textContent = "☀️ Modo claro";
}

$("musicBtn").addEventListener("click", toggleMusic);

/* MISIONES DIARIAS */

const missions = [
  { id: "games", title: "Completa 2 partidas", goal: 2, reward: 20 },
  { id: "hits", title: "Consigue 20 aciertos", goal: 20, reward: 25 },
  { id: "accuracy", title: "Alcanza 85% de precisión", goal: 85, reward: 30 },
  { id: "phrases", title: "Escribe 3 frases", goal: 3, reward: 25 }
];

function updateMissions() {
  missions.forEach(mission => {
    const value = data.daily[mission.id] || 0;

    if (value >= mission.goal && !data.daily.claimed.includes(mission.id)) {
      data.daily.claimed.push(mission.id);
      data.coins += mission.reward;
    }
  });
}

function renderMissions() {
  const container = $("missionList");
  container.innerHTML = "";

  missions.forEach(mission => {
    const value = Math.min(data.daily[mission.id] || 0, mission.goal);
    const complete = data.daily.claimed.includes(mission.id);
    const percent = Math.round((value / mission.goal) * 100);

    const item = document.createElement("div");
    item.className = "mission";

    const heading = document.createElement("div");
    heading.className = "mission-head";

    const title = document.createElement("strong");
    title.textContent = mission.title;

    const reward = document.createElement("span");
    reward.textContent = complete ? "✅ Completada" : "🪙 " + mission.reward;

    heading.append(title, reward);

    const progress = document.createElement("div");
    progress.className = "progress";

    const bar = document.createElement("div");
    bar.style.width = percent + "%";

    progress.appendChild(bar);

    const description = document.createElement("small");
    description.textContent = value + " / " + mission.goal;

    item.append(heading, progress, description);
    container.appendChild(item);
  });
}

/* MASCOTAS */

function getPetEvolution() {
  if (data.xp >= 1000) return 3;
  if (data.xp >= 300) return 2;
  return 1;
}

function renderPets() {
  const pet = pets[data.selectedPet] || pets[0];

  $("activePet").textContent = pet[1];
  $("activePetName").textContent = pet[0];
  $("petEvolution").textContent = "Nivel de evolución: " + getPetEvolution();

  const grid = $("petGrid");
  grid.innerHTML = "";

  pets.forEach((item, index) => {
    const owned = data.ownedPets.includes(index);
    const selected = data.selectedPet === index;

    const button = document.createElement("button");
    button.className = "pet-card" + (selected ? " selected" : "");
    button.disabled = selected;

    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = item[1];

    const name = document.createElement("strong");
    name.textContent = item[0];

    const price = document.createElement("small");
    price.textContent = selected ? "Activa" :
      owned ? "Desbloqueada" : "🪙 " + item[2];

    button.append(emoji, name, price);

    button.addEventListener("click", () => {
      if (owned) {
        data.selectedPet = index;
      } else if (data.coins >= item[2]) {
        data.coins -= item[2];
        data.ownedPets.push(index);
        data.selectedPet = index;
      } else {
        alert("Todavía no tienes suficientes monedas.");
        return;
      }

      saveData();
      renderDashboard();
    });

    grid.appendChild(button);
  });
}

/* RANKING LOCAL */

function renderRanking() {
  const list = $("rankingList");
  list.innerHTML = "";

  const ranking = [
    { name: "Tú", score: data.record },
    ...data.history.map((item, index) => ({
      name: "Partida " + (index + 1),
      score: item.score
    }))
  ].sort((a, b) => b.score - a.score);

  ranking.slice(0, 10).forEach((player, index) => {
    const li = document.createElement("li");
    li.textContent =
      ["🥇", "🥈", "🥉"][index] || (index + 1) + ".";

    li.textContent += " " + player.name + " — " + player.score + " puntos";
    list.appendChild(li);
  });
}

/* LOGROS Y TROFEOS */

const achievements = [
  { id: "first", name: "Primera partida", icon: "🎮", test: () => data.games >= 1 },
  { id: "five", name: "Cinco partidas", icon: "⭐", test: () => data.games >= 5 },
  { id: "ten", name: "Diez partidas", icon: "🏅", test: () => data.games >= 10 },
  { id: "hundred", name: "Cien aciertos", icon: "🎯", test: () => data.totalHits >= 100 },
  { id: "fast", name: "Velocidad experta", icon: "⚡", test: () => data.bestPPM >= 40 },
  { id: "pet", name: "Coleccionista", icon: "🐾", test: () => data.ownedPets.length >= 10 },
  { id: "xp", name: "Gran experiencia", icon: "💎", test: () => data.xp >= 500 },
  { id: "coins", name: "Ahorrista", icon: "🪙", test: () => data.coins >= 100 },
  { id: "accuracy", name: "Precisión perfecta", icon: "🎯", test: () => data.history.some(item => item.accuracy === 100) }
];

function checkAchievements() {
  achievements.forEach(item => {
    if (item.test() && !data.achievements.includes(item.id)) {
      data.achievements.push(item.id);
      data.coins += 15;
    }
  });
}

function renderAchievements() {
  const grid = $("achievementList");
  grid.innerHTML = "";

  achievements.forEach(item => {
    const unlocked = data.achievements.includes(item.id);

    const card = document.createElement("div");
    card.className = "achievement" + (unlocked ? " unlocked" : "");

    const icon = document.createElement("span");
    icon.textContent = item.icon;

    const name = document.createElement("strong");
    name.textContent = item.name;

    const status = document.createElement("p");
    status.textContent = unlocked ? "Desbloqueado" : "Bloqueado";

    card.append(icon, name, status);
    grid.appendChild(card);
  });
}

/* RULETA DE PREMIOS */

$("spinBtn").addEventListener("click", () => {
  if (game.spun) {
    $("spinResult").textContent = "Ya utilizaste la ruleta en esta partida.";
    return;
  }

  const prizes = [5, 10, 15, 20, 25, 30, 40, 50];
  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  game.spun = true;
  data.coins += prize;

  $("spinResult").textContent = "🎉 ¡Ganaste " + prize + " monedas!";
  $("spinBtn").disabled = true;

  saveData();
  renderDashboard();
});

/* INICIO */

renderDashboard();
updateGameDisplay();
