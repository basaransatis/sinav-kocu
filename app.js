
const $ = (id) => document.getElementById(id);
const KEY = "sinavKocu.v1";

const defaultTopics = [
  { exam: "TYT", subject: "Matematik", name: "Temel kavramlar" },
  { exam: "TYT", subject: "Matematik", name: "Problemler" },
  { exam: "TYT", subject: "Türkçe", name: "Paragraf" },
  { exam: "TYT", subject: "Fizik", name: "Madde ve özellikleri" },
  { exam: "TYT", subject: "Kimya", name: "Atom ve periyodik sistem" },
  { exam: "TYT", subject: "Biyoloji", name: "Hücre" },
  { exam: "AYT", subject: "Matematik", name: "Fonksiyonlar" },
  { exam: "AYT", subject: "Matematik", name: "Trigonometri" },
  { exam: "AYT", subject: "Fizik", name: "Kuvvet ve hareket" },
  { exam: "AYT", subject: "Kimya", name: "Modern atom teorisi" },
  { exam: "AYT", subject: "Biyoloji", name: "Hücre bölünmeleri" },
  { exam: "AYT", subject: "Edebiyat", name: "Şiir bilgisi" }
];

let data;
try {
  data = JSON.parse(localStorage.getItem(KEY)) || {};
} catch {
  data = {};
}

data.tasks ||= [];
data.topics ||= {};
data.daily ||= {};
let selectedExam = "TYT";
let seconds = 25 * 60;
let running = false;
let timerId = null;

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function todayData() {
  const key = todayKey();
  if (!data.daily[key]) data.daily[key] = { minutes: 0 };
  return data.daily[key];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function renderTasks() {
  const list = $("taskList");
  list.innerHTML = "";

  if (!data.tasks.length) {
    list.innerHTML = '<p class="muted">Henüz görev yok. İlk hedefini ekle! ✨</p>';
  }

  data.tasks.forEach(task => {
    const row = document.createElement("div");
    row.className = `task ${task.done ? "completed" : ""}`;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", `${task.text} tamamlandı`);
    check.addEventListener("change", () => {
      task.done = check.checked;
      save();
      render();
    });

    const text = document.createElement("span");
    text.textContent = task.text;

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Görevi sil");
    del.addEventListener("click", () => {
      data.tasks = data.tasks.filter(t => t.id !== task.id);
      save();
      render();
    });

    row.append(check, text, del);
    list.append(row);
  });

  const done = data.tasks.filter(t => t.done).length;
  $("taskCount").textContent = `${done}/${data.tasks.length}`;
  $("taskBar").style.width = data.tasks.length
    ? `${done / data.tasks.length * 100}%` : "0%";
}

function renderTopics() {
  const list = $("topicList");
  list.innerHTML = "";

  defaultTopics.filter(t => t.exam === selectedExam).forEach(topic => {
    const key = `${topic.exam}|${topic.subject}|${topic.name}`;
    const status = data.topics[key] || "Başlamadım";
    const row = document.createElement("div");
    row.className = "topic";

    const info = document.createElement("span");
    info.innerHTML = `<strong>${escapeHTML(topic.name)}</strong><br>
      <small>${escapeHTML(topic.subject)}</small>`;

    const select = document.createElement("select");
    select.setAttribute("aria-label", `${topic.name} konu durumu`);

    ["Başlamadım", "Öğreniyorum", "Tekrar edeceğim", "Tamamlandı"]
      .forEach(option => {
        const el = document.createElement("option");
        el.value = option;
        el.textContent = option;
        el.selected = option === status;
        select.append(el);
      });

    select.addEventListener("change", () => {
      data.topics[key] = select.value;
      save();
      render();
    });

    row.append(info, select);
    list.append(row);
  });
}

function renderStats() {
  $("studyTotal").textContent = `${todayData().minutes} dk`;
}

function render() {
  renderTasks();
  renderTopics();
  renderStats();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
  $("themeBtn").setAttribute("aria-label",
    theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç");
  localStorage.setItem("sinavKocu.theme", theme);
}

$("themeBtn").addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("taskInput");
  const text = input.value.trim();
  if (!text) return;

  data.tasks.push({
    id: `${Date.now()}-${Math.random()}`,
    text,
    done: false
  });

  input.value = "";
  save();
  render();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    selectedExam = button.dataset.exam;
    document.querySelectorAll(".filter").forEach(b =>
      b.classList.toggle("active", b === button)
    );
    renderTopics();
  });
});

function showTimer() {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  $("timer").textContent =
    `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function stopTimer() {
  running = false;
  clearInterval(timerId);
  timerId = null;
  $("startTimer").textContent = "Başlat";
}

$("startTimer").addEventListener("click", () => {
  if (running) {
    stopTimer();
    return;
  }

  if (seconds <= 0) seconds = 25 * 60;
  running = true;
  $("startTimer").textContent = "Duraklat";
  $("timerStatus").textContent = "Odaklanıyorsun. Devam et!";

  timerId = setInterval(() => {
    seconds--;
    showTimer();

    if (seconds <= 0) {
      stopTimer();
      todayData().minutes += 25;
      save();
      renderStats();
      $("timerStatus").textContent = "Oturum tamamlandı! 25 dakika kaydedildi.";
      seconds = 25 * 60;
      showTimer();
      $("startTimer").textContent = "Yeniden başlat";
    }
  }, 1000);
});

$("resetTimer").addEventListener("click", () => {
  stopTimer();
  seconds = 25 * 60;
  showTimer();
  $("timerStatus").textContent = "25 dakika çalışma";
});

const dateText = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long", day: "numeric", month: "long"
}).format(new Date());

$("today").textContent = dateText.toLocaleUpperCase("tr-TR");

applyTheme(localStorage.getItem("sinavKocu.theme") || "light");
showTimer();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(err => {
      console.error("Çevrimdışı desteği başlatılamadı:", err);
    });
  });
}
