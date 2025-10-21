const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzs8i5LuD2A4Gmofxae7kdtP-Wd3gygz1nk264GUMiULHLgVViu1qSuTtyUm0KWV36NOg/exec"; // <-- วาง URL จาก Google Apps Script Web App

document.addEventListener("DOMContentLoaded", async () => {
  await loadStrategicOptions();
});

async function loadStrategicOptions() {
  const res = await fetch(`${YOUR_WEB_APP_URL}?action=getStrategicData`);
  const data = await res.json();

  const strategySelect = document.getElementById("strategySelect");
  data.strategies.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    strategySelect.appendChild(opt);
  });

  strategySelect.addEventListener("change", () => {
    const soSelect = document.getElementById("soSelect");
    const kpiSelect = document.getElementById("kpiSelect");
    soSelect.innerHTML = "";
    kpiSelect.innerHTML = "";

    const selectedSO = data.so.filter(item => item.strategy === strategySelect.value);
    selectedSO.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = item.name;
      soSelect.appendChild(opt);
    });

    soSelect.addEventListener("change", () => {
      kpiSelect.innerHTML = "";
      const kpiList = data.kpi.filter(k => k.so === soSelect.value);
      kpiList.forEach(k => {
        const opt = document.createElement("option");
        opt.value = k.name;
        opt.textContent = k.name;
        kpiSelect.appendChild(opt);
      });
    });
  });
}

document.getElementById("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target));
  const res = await fetch(SHEET_API_URL, {
    method: "POST",
    body: JSON.stringify(formData),
  });
  const result = await res.json();
  alert(result.message);
});

