/* script.js
   Frontend logic:
   - โหลด strategic data → เติม dropdown
   - CRUD: create/read/update/delete โดยเรียก API_URL?action=...
   - render ตาราง, edit (fill form), delete
*/

const API_URL = "https://script.google.com/macros/s/AKfycbzwhwofMfzdGKVaUqY4NZm13hcbfFrmgxveo2KZLWe6yuTJMmkFyAmHlfhekJX3ysuOqg/exec"; // <<== แก้เป็นของคุณ

/* ----------------- Helpers: callApi ----------------- */
async function callApi(action, payload = {}) {
  if (!API_URL || API_URL.includes("https://script.google.com/macros/s/AKfycbzwhwofMfzdGKVaUqY4NZm13hcbfFrmgxveo2KZLWe6yuTJMmkFyAmHlfhekJX3ysuOqg/exec")) {
    alert("กรุณาตั้งค่า API_URL ใน script.js ให้เป็น Web App URL ของคุณ");
    throw new Error("API_URL not set");
  }
  const url = API_URL + "?action=" + encodeURIComponent(action);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

/* ----------------- Dropdown: load strategic data ----------------- */
let STRATEGIC = {}; // จะถูกเติมจาก API
async function loadStrategic() {
  try {
    const resp = await callApi('strategic', {});
    // resp might be string if doPost returned text - ensure object
    STRATEGIC = (typeof resp === 'string') ? JSON.parse(resp) : resp;
  } catch (err) {
    console.error("loadStrategic error:", err);
    // fallback: if API fail, embed local minimal mapping (optional)
    STRATEGIC = {}; 
  }

  const strategyEl = document.getElementById('strategy');
  const soEl = document.getElementById('so');
  const kpiEl = document.getElementById('kpi');

  // clear
  strategyEl.innerHTML = '<option value="">-- เลือกยุทธศาสตร์ --</option>';
  soEl.innerHTML = '<option value="">-- เลือก SO --</option>';
  kpiEl.innerHTML = '<option value="">-- เลือก KPI --</option>';

  Object.keys(STRATEGIC).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    strategyEl.appendChild(opt);
  });

  strategyEl.addEventListener('change', (e) => {
    const val = e.target.value;
    soEl.innerHTML = '<option value="">-- เลือก SO --</option>';
    kpiEl.innerHTML = '<option value="">-- เลือก KPI --</option>';
    if (!val) return;
    const soObj = STRATEGIC[val];
    Object.keys(soObj).forEach(soKey => {
      const opt = document.createElement('option');
      opt.value = soKey;
      opt.textContent = soKey + " — " + (soObj[soKey].length ? `(${soObj[soKey].length} KPI)` : '');
      soEl.appendChild(opt);
    });
  });

  soEl.addEventListener('change', (e) => {
    const strategyVal = strategyEl.value;
    const soVal = e.target.value;
    kpiEl.innerHTML = '<option value="">-- เลือก KPI --</option>';
    if (!strategyVal || !soVal) return;
    const kpis = STRATEGIC[strategyVal][soVal] || [];
    kpis.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      kpiEl.appendChild(opt);
    });
  });
}

/* ----------------- Load table data ----------------- */
async function loadProjects() {
  try {
    const data = await callApi('read', {});
    // data expected array
    renderTable(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("loadProjects", err);
    alert("ไม่สามารถโหลดข้อมูลได้");
  }
}

/* ----------------- Render table ----------------- */
function renderTable(data) {
  const headEl = document.getElementById('tableHead');
  const bodyEl = document.getElementById('tableBody');
  headEl.innerHTML = '';
  bodyEl.innerHTML = '';
  if (!data || data.length === 0) {
    headEl.innerHTML = '<tr><th>ไม่มีข้อมูล</th></tr>';
    return;
  }
  const headers = Object.keys(data[0]);

  // thead
  const ths = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + `<th>จัดการ</th>`;
  headEl.innerHTML = `<tr>${ths}</tr>`;

  // tbody
  bodyEl.innerHTML = data.map((row, idx) => {
    const tds = headers.map(h => `<td>${escapeHtml(row[h] || '')}</td>`).join('');
    return `<tr>
      ${tds}
      <td>
        <button class="btn-edit" data-id="${escapeHtml(row['ID']||'')}">แก้ไข</button>
        <button class="btn-delete" data-id="${escapeHtml(row['ID']||'')}">ลบ</button>
      </td>
    </tr>`;
  }).join('');

  // attach events
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      editById(id);
    });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      deleteById(id);
    });
  });
}

/* ----------------- Edit: เติมข้อมูลลงฟอร์มโดยหา record จาก table data ----------------- */
async function editById(id) {
  if (!id) return alert('ไม่พบ ID ที่จะแก้ไข');
  // โหลดข้อมูลทั้งหมด แล้วค้นหา ID
  try {
    const all = await callApi('read', {});
    const data = Array.isArray(all) ? all : [];
    const rec = data.find(r => String(r['ID']) === String(id));
    if (!rec) return alert('ไม่พบข้อมูลที่เลือก');
    // เติมฟอร์ม
    const form = document.getElementById('projectForm');
    Object.keys(rec).forEach(k => {
      const el = form.querySelector(`[name="${cssEscapeName(k)}"]`);
      if (el) {
        el.value = rec[k] || '';
        // ถ้าเป็นยุทธศาสตร์/so/kpi ให้ trigger change
        if (el.id === 'strategy') el.dispatchEvent(new Event('change'));
      }
    });
    // set hidden ID
    document.getElementById('formID').value = rec['ID'] || '';
    // scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    alert('ไม่สามารถโหลดข้อมูลสำหรับแก้ไขได้');
  }
}

/* ----------------- Delete by ID ----------------- */
async function deleteById(id) {
  if (!id) return alert('ID ไม่ถูกต้อง');
  if (!confirm('ยืนยันการลบข้อมูลหรือไม่?')) return;
  try {
    const resp = await callApi('delete', { id });
    if (resp && resp.status === 'success') {
      alert(resp.message);
      await loadProjects();
    } else {
      alert('ลบไม่สำเร็จ: ' + (resp.message || JSON.stringify(resp)));
    }
  } catch (err) {
    console.error(err);
    alert('ลบไม่สำเร็จ');
  }
}

/* ----------------- Submit form (create / update) ----------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadStrategic();
  loadProjects();

  const form = document.getElementById('projectForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const obj = {};
    for (const [k, v] of fd.entries()) obj[k] = v;
    try {
      if (obj['ID'] && obj['ID'].trim()) {
        // update
        const payload = { id: obj['ID'], data: obj };
        const resp = await callApi('update', payload);
        if (resp && resp.status === 'success') {
          alert(resp.message);
          form.reset();
          await loadProjects();
        } else {
          alert('อัปเดตไม่สำเร็จ: ' + JSON.stringify(resp));
        }
      } else {
        // create
        const resp = await callApi('create', obj);
        if (resp && resp.status === 'success') {
          alert(resp.message);
          form.reset();
          await loadProjects();
        } else {
          alert('บันทึกไม่สำเร็จ: ' + JSON.stringify(resp));
        }
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดระหว่างบันทึก');
    }
  });

  // reset handler: clear hidden ID
  form.addEventListener('reset', () => {
    document.getElementById('formID').value = '';
    // reset kpi/so dropdowns
    const so = document.getElementById('so'), kpi = document.getElementById('kpi');
    if (so) so.innerHTML = '<option value="">-- เลือก SO --</option>';
    if (kpi) kpi.innerHTML = '<option value="">-- เลือก KPI --</option>';
  });
});

/* ----------------- Utilities ----------------- */
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cssEscapeName(name) {
  // Attribute selector uses brackets; escape quotes
  return name.replace(/"/g, '\\"');
}
