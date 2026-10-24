
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
let sessionSeconds = 25 * 60;
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


function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function showTimer() {
  $("timer").textContent = formatTime(seconds);
}

function stopTimer() {
  running = false;
  clearInterval(timerId);
  timerId = null;
  $("startTimer").textContent = "Başlat";
}

function selectedDuration() {
  const hours = Number($("durationHours").value);
  const minutes = Number($("durationMinutes").value);

  if (
    $("durationHours").value.trim() === "" ||
    $("durationMinutes").value.trim() === "" ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 || hours > 24 ||
    minutes < 0 || minutes > 59
  ) {
    return 0;
  }

  const total = hours * 60 + minutes;
  return total > 0 && total <= 1440 ? total : 0;
}

function setDuration(totalMinutes) {
  if (running) {
    $("timerStatus").textContent = "Önce sayacı duraklat.";
    return;
  }

  if (!Number.isInteger(totalMinutes) ||
      totalMinutes < 1 || totalMinutes > 1440) {
    $("timerStatus").textContent = "1 dakika ile 24 saat arasında bir süre seç.";
    return;
  }

  $("durationHours").value = Math.floor(totalMinutes / 60);
  $("durationMinutes").value = totalMinutes % 60;

  sessionSeconds = totalMinutes * 60;
  seconds = sessionSeconds;
  showTimer();

  $("timerStatus").textContent =
    `${totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} saat ${totalMinutes % 60} dakika`
      : `${totalMinutes} dakika`} çalışma`;

  $("startTimer").textContent = "Başlat";
}

$("setDuration").addEventListener("click", () => {
  const minutes = selectedDuration();

  if (!minutes) {
    $("timerStatus").textContent = "Geçerli bir süre gir.";
    return;
  }

  setDuration(minutes);
});

document.querySelectorAll(".preset").forEach(button => {
  button.addEventListener("click", () => {
    setDuration(Number(button.dataset.minutes));
  });
});

$("startTimer").addEventListener("click", () => {
  if (running) {
    stopTimer();
    $("timerStatus").textContent = "Sayaç duraklatıldı.";
    return;
  }

  if (seconds <= 0) seconds = sessionSeconds;

  running = true;
  $("startTimer").textContent = "Duraklat";
  $("timerStatus").textContent = "Odaklanıyorsun. Devam et!";

  timerId = setInterval(() => {
    seconds = Math.max(0, seconds - 1);
    showTimer();

    if (seconds === 0) {
      stopTimer();

      todayData().minutes += Math.ceil(sessionSeconds / 60);
      save();
      renderStats();

      $("timerStatus").textContent =
        "Oturum tamamlandı! Çalışma süren kaydedildi.";

      $("startTimer").textContent = "Yeniden başlat";
    }
  }, 1000);
});

$("resetTimer").addEventListener("click", () => {
  stopTimer();
  seconds = sessionSeconds;
  showTimer();
  $("timerStatus").textContent = "Sayaç sıfırlandı.";
});

setDuration(25);


function renderCountdown(exam, year, month, day) {
  const output = document.getElementById(
    exam.toLowerCase() + "Days"
  );

  // Ay numarası JavaScript'te 0'dan başlar.
  const target = new Date(year, month - 1, day, 0, 0, 0);
  const now = new Date();

  const remaining = target.getTime() - now.getTime();

  if (remaining <= 0) {
    output.textContent = "Sınav günü!";
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  output.textContent =
    `${days} gün ${hours} saat ` +
    `${minutes} dakika ${seconds} saniye`;
}

function updateCountdowns() {
  renderCountdown("TYT", 2027, 6, 19);
  renderCountdown("AYT", 2027, 6, 20);
}

updateCountdowns();
setInterval(updateCountdowns, 1000);


["TYT", "AYT"].forEach(exam => {
  const input = $(`${exam.toLowerCase()}DateInput`);

  input.addEventListener("change", () => {
    if (input.value) {
      examDates[exam] = input.value;
    } else {
      delete examDates[exam];
    }

    localStorage.setItem(
      EXAM_DATES_KEY,
      JSON.stringify(examDates)
    );

    renderCountdown(exam);
  });

  renderCountdown(exam);
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
(function () {
  function updateExamCountdown(id, year, month, day) {
    const el = document.getElementById(id);
    if (!el) return;

    const target = new Date(year, month - 1, day, 0, 0, 0);
    const diff = target.getTime() - Date.now();

    if (diff <= 0) {
      el.textContent = "Sınav günü!";
      return;
    }

    const total = Math.floor(diff / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    el.textContent =
      `${days} gün ${hours} saat ${minutes} dakika ${seconds} saniye`;
  }

  function updateAll() {
    updateExamCountdown("tytDays", 2027, 6, 19);
    updateExamCountdown("aytDays", 2027, 6, 20);
  }

  updateAll();
  setInterval(updateAll, 1000);
})();
