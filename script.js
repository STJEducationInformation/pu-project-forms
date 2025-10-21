/**
 * script.js - สำหรับโปรเจกต์ "ระบบจัดการข้อมูลโครงการ"
 * - ใส่ไฟล์นี้ใน GitHub alongside index.html และ dashboard.html
 * - แก้ API_URL ให้เป็น URL ของ Web App ที่ได้จาก Deploy ใน Apps Script
 *
 * ฟังก์ชัน:
 * - dependent dropdown (ยุทธศาสตร์ -> SO -> KPI)
 * - loadProjects() : อ่านข้อมูลจาก Google Sheet (ผ่าน Apps Script)
 * - submit (create) / edit (update) / delete
 * - renderTable() : แสดงข้อมูลในหน้า index.html
 */

/* ==================  CONFIG  ================== */
// แก้เป็น URL ของคุณ (Web App URL จาก Apps Script Deploy)
const API_URL = "https://script.google.com/macros/s/AKfycbyKvk0cDsR-0dwwbon3Zi_wKGDARSeBvr9oRVZdsdJmvYqxEBtETsCDhCJ13-KdCIIu1g/exec";

/* ==================  DATA MAPPING (ยุทธศาสตร์ / SO / KPI)  ==================
   นี่คือ mapping ที่นำมาจากข้อความยุทธศาสตร์ที่คุณส่งมา
   - คีย์ระดับบน: ยุทธศาสตร์หลัก
   - คีย์ระดับกลาง: SO (วัตถุประสงค์เชิงกลยุทธ์)
   - ค่ารายการ: อาร์เรย์ของ KPI (แต่ละสตริงเป็นตัวชี้วัด)
*/
const strategies = {
  "ยุทธศาสตร์ที่ 1 : Modernized Human capital": {
    "SO1: การพัฒนาทรัพยากรมนุษย์ (HRD) การพัฒนาและยกระดับสมรรถนะบุคลากร (Human Capital Development)": [
      "KPI 1.1 ร้อยละของบุคลากรที่มีแผนพัฒนารายบุคคล (IDP coverage)",
      "KPI 1.2 ร้อยละของบุคลากรที่ได้รับการดำเนินการตามแผน IDP",
      "KPI 1.3 ร้อยละของสมรรถนะเป้าหมายที่ได้รับการพัฒนายกระดับขึ้นอย่างน้อย 1 ระดับภายใน 12 เดือน (Competency gap closure)"
    ],
    "SO1-เป้าหมาย2: Critical - skill upskilling for flagship line": [
      "KPI 2.1 ร้อยละของบุคลากรที่ได้รับการรับรองคุณวุฒิ/ประกาศนียบัตร (Certification)",
      "KPI 2.2 จำนวนผลงานวิจัย นวัตกรรม หรือรางวัล ที่นำมาประยุกต์ใช้ (Brand Reputation)",
      "KPI 2.3 คะแนนความพึงพอใจของผู้ป่วยที่ได้รับบริการจากสายบริการหลัก"
    ],
    "SO1-เป้าหมาย3: Leadership Development Coverage": [
      "KPI 3.1 ร้อยละของหัวหน้างานที่เข้าร่วมโครงการภาวะผู้นำ",
      "KPI 3.2 ร้อยละของพนักงานที่ยังคงทำงานอยู่ภายใต้หัวหน้างานที่ได้รับการพัฒนา (Staff Retention)"
    ],
    "SO1-เป้าหมาย4: Learning Organization and Knowledge Management": [
      "KPI 4.1 จำนวนครั้ง/โครงการที่จัดเพื่อแบ่งปันความรู้ (CoP, Journal Club, KM Day)",
      "KPI 4.2 คะแนนความพึงพอใจของผู้ป่วยต่อคุณภาพบริการที่สะท้อน KM",
      "KPI 4.3 ร้อยละของบุคลากรที่นำความรู้ไปประยุกต์ใช้จริง"
    ],
    "SO2: การจัดการทรัพยากรมนุษย์ (HRM) Workforce Management": [
      "KPI 1.1 ร้อยละของหน่วยงานที่มี Staff-to-Patient Ratio ตามมาตรฐาน",
      "KPI 1.2 ร้อยละของบุคลากรที่ออกจากงาน (Turnover Rate)",
      "KPI 1.3 ร้อยละของจำนวนบุคลากรเทียบกับมาตรฐาน/แผน"
    ],
    "SO2-เป้าหมาย2: Recruitment & Onboarding Excellence": [
      "KPI 2.1 Time-to-fill (วันเฉลี่ยการสรรหา)",
      "KPI 2.2 Quality of Hire (ร้อยละพนักงานใหม่ผ่าน probation ≥80%)",
      "KPI 2.3 Onboarding Completion Rate",
      "KPI 2.4 New Hire Retention Rate (6-12 เดือน)"
    ],
    "SO2-เป้าหมาย3: Scheduling, Attendance & Leave Management": [
      "KPI 3.1 On-time Attendance Rate",
      "KPI 3.2 Leave Planning (ร้อยละที่วางแผนล่วงหน้า ≥14 วัน)",
      "KPI 3.3 Coverage During Leave",
      "KPI 3.4 จำนวนเหตุการณ์ความเสี่ยงจากการจัดกำลังคนไม่เพียงพอ"
    ],
    "SO3: Engagement workforce (Employee Retention & Engagement)": [
      "KPI 1.1 จำนวนโครงการ/กิจกรรมเสริมสร้างความผูกพัน",
      "KPI 1.2 Retention rate (ร้อยละพนักงานที่ยังคงทำงาน)",
      "KPI 1.3 ร้อยละบุคลากรมี engagement ตามแบบสอบถาม",
      "KPI 1.4 คะแนนความพึงพอใจของบุคลากร",
      "KPI 1.5 ร้อยละของบุคลากรที่มี Engagement Score ≥85%"
    ],
    "SO3-เป้าหมาย2: Recognition & Appreciation": [
      "KPI 2.1 คะแนนความพึงพอใจจากการได้รับการยอมรับ",
      "KPI 2.2 Recognition Coverage Rate (ร้อยละบุคลากรที่ได้รับการยกย่อง)",
      "KPI 2.3 จำนวนครั้งต่อปีที่จัดโครงการยกย่อง (Star of the Month ฯลฯ)"
    ],
    "SO3-เป้าหมาย3: Wellbeing & Work-Life": [
      "KPI 3.1 ร้อยละบุคลากรที่เข้าร่วมโครงการส่งเสริมสุขภาวะ",
      "KPI 3.2 ร้อยละบุคลากรที่มีระดับความสุข ≥70% (Happy Nanometer)",
      "KPI 3.3 ร้อยละบุคลากรที่มีสมดุลชีวิตการทำงานในระดับสูง"
    ],
    "SO3-เป้าหมาย4: Voice of Employee Action (VoE Loop)": [
      "KPI 4.1 ร้อยละของประเด็น VoE ที่ได้รับการดำเนินการและสื่อสารผล"
    ]
  },

  "ยุทธศาสตร์ที่ 2 : Excellence of Service and Healthcare": {
    "SO4: Excellence Service and Healthcare": [
      "KPI 1.1 ระดับการประเมินมาตรฐาน (HA/ISO/HS4)",
      "KPI 1.2 จำนวนเตียงผู้ป่วย",
      "KPI 1.3 การรับรอง DSC"
    ],
    "SO5: Trust Enhancement (Patient • People • Personal Safety)": [
      "KPI 1.1 จำนวนอุบัติการณ์ผ่าตัดผิดคน/ผิดข้าง/ผิดตำแหน่ง (ระดับ E / ทั้งหมด)"
    ],
    "SO5-เป้าหมาย2: การติดเชื้อสำคัญ (SSI, VAP, CAUTI, CLABSI)": [
      "KPI 2.1 อัตราการติดเชื้อในโรงพยาบาล (HAI / 1,000 วันนอน)"
    ],
    "SO5-เป้าหมาย3: บุคลากรติดเชื้อจากการปฏิบัติหน้าที่": [
      "KPI 3.1 ร้อยละอุบัติการณ์บุคลากรติดเชื้อจากการทำงาน"
    ],
    "SO5-เป้าหมาย4: med error, advert drug event": [
      "KPI 4.1 ร้อยละอุบัติการณ์ med error / advert drug event"
    ],
    "SO5-เป้าหมาย5: การให้เลือดผิดคน/ผิดหมู่/ผิดชนิด": [
      "KPI 5.1 ร้อยละอุบัติการณ์การให้เลือดผิดคน/ผิดหมู่ (ระดับ E ขึ้นไป)"
    ],
    "SO5-เป้าหมาย6: การระบุตัวผู้ป่วยผิดพลาด": [
      "KPI 6.1 ร้อยละอุบัติการณ์การระบุตัวผู้ป่วยผิดพลาด (ระดับ E ขึ้นไป)"
    ],
    "SO5-เป้าหมาย7: ความคลาดเคลื่อนในการวินิจฉัยโรค": [
      "KPI 7.1 ร้อยละอุบัติการณ์การวินิจฉัยคลาดเคลื่อน (ระดับ E ขึ้นไป)"
    ],
    "SO5-เป้าหมาย8: การรายงานผล lab / patho คลาดเคลื่อน": [
      "KPI 8.1 จำนวนอุบัติการณ์การตรวจวิเคราะห์ทางพยาธิและรายงานผลคลาดเคลื่อน"
    ],
    "SO5-เป้าหมาย9: การคัดกรองที่ห้องฉุกเฉินคลาดเคลื่อน": [
      "KPI 9.1 ร้อยละผู้ป่วยที่มี Under triage",
      "KPI 9.2 ร้อยละผู้ป่วยที่มี Over triage"
    ],
    "SO6: Agile Hospital and Resilient Organization": [
      "KPI 1.1 คะแนนความพึงพอใจของผู้รับบริการ",
      "KPI 2.1 BCP Coverage (% หน่วยที่มี/ทดสอบ BCP)",
      "KPI 2.2 % บริการสำคัญที่ดำเนินต่อได้ในภาวะวิกฤต"
    ],
    "SO7: Customer segmentation, targeting, Equity & Marketing data-driven Segmentation": [
      "KPI 1.1 ร้อยละของข้อมูลตามสิทธิถูกนำมาวิเคราะห์เพื่อจัดทำแผนรายได้",
      "KPI 2.1 Patient Return Visit (%)",
      "KPI 3.1 ร้อยละของรายได้ตามสิทธิหลักเพิ่มขึ้น"
    ]
  },

  "ยุทธศาสตร์ที่ 3 : digital technology for AI transformation": {
    "SO8: Network and Societal Responsibility": [
      "KPI 1.1 จำนวนโครงการบริการของโรงพยาบาลร่วมกับภาคีเครือข่าย",
      "KPI 2.1 ข้อร้องเรียนด้านการจัดการสิ่งแวดล้อม",
      "KPI 2.2 ร้อยละความสำเร็จของการรับรอง Green and Clean Hospital",
      "KPI 2.3 ร้อยละการปล่อยมลพิษ (Carbon Emission)"
    ],
    "SO9: Information Driven Hospital": [
      "KPI 1.1 smart hospital ระดับ ทอง (มาตรฐาน Smart Hospital ระดับทอง)"
    ],
    "SO10: Transform AI Digital Hospital": [
      "KPI 1.1 % coverage area AI based (สัดส่วนพื้นที่ที่ใช้ AI)"
    ]
  },

  "ยุทธศาสตร์ที่ 4 : Uplifting Management Organization for sustainability": {
    "SO11: Efficient work process": [
      "KPI 1.1 จำนวนโครงการ Lean Process"
    ],
    "SO12: Procurement Management (LAW, Regulations, Rules)": [
      "KPI 1.1 ร้อยละการจัดซื้อแบบเฉพาะเจาะจง (ลดลง)",
      "KPI 2.1 ร้อยละต้นทุนการจัดซื้อ (ลดลง)",
      "KPI 3.1 คะแนนการประเมินความโปร่งใสและธรรมาภิบาล (ITA)"
    ],
    "SO13: Financial Sustainability": [
      "KPI 1.1 ร้อยละ Net Profit Margin เพิ่มขึ้น",
      "KPI 2.1 ร้อยละ EBITDA เพิ่มขึ้น",
      "KPI 3.1 ร้อยละ Inventory Turnover Rate เพิ่มขึ้น",
      "KPI 4.1 จำนวนเงินบริจาคที่ได้รับรวมต่อปี (ล้านบาท)"
    ],
    "SO14: Transparency Organization": [
      "KPI 1.1 e-GP Posting Completeness = 100%",
      "KPI 2.1 คะแนน ITA รวมองค์กร",
      "KPI 3.1 คะแนนความเชื่อมั่นบุคลากร (Staff Trust Index)"
    ],
    "SO15: MED/LAB IMS (Integrated Medical Service)": [
      "KPI 1.1 ร้อยละการขาดคราวของยา",
      "KPI 2.1 ร้อยละยาหมดอายุ",
      "KPI 3.1 อัตราความผิดพลาดในการใช้ยาต่อ 1,000 การสั่งใช้ยา"
    ]
  },

  "ยุทธศาสตร์ที่ 5 : Professional for Academic and Research": {
    "SO16: Learning Organization and Promote Research and Innovation (R2R/CQI/research)": [
      "KPI 1.1 จำนวนโครงการวิจัยผ่านคณะกรรมการจริยธรรม (จำนวน/ปี)",
      "KPI 1.2 ร้อยละองค์ความรู้/นวัตกรรมที่นำไปใช้ประโยชน์จริง",
      "KPI 2.1 จำนวนงานวิจัยตีพิมพ์ในวารสารระดับชาติ/นานาชาติ",
      "KPI 3.1 จำนวนความร่วมมือ/ MOU ทางวิชาการ",
      "KPI 4.1 ร้อยละเงินทุนวิจัยที่ได้รับจากแหล่งภายนอก",
      "KPI 5.1 จำนวนศูนย์ Training center"
    ],
    "SO17: Leading Hospital for Medical and Health Science Education": [
      "KPI 1.1 จำนวนหลักสูตรวิทยาศาสตร์สุขภาพที่ขึ้นฝึกปฏิบัติงาน รพ.",
      "KPI 1.2 คะแนนความพึงพอใจต่อการเรียนการสอน / clinical training",
      "KPI 1.3 จำนวนผลงานวิจัย/นวัตกรรมที่เชื่อมโยงกับการเรียนการสอน"
    ]
  }
};

/* ==================  UI / Dropdown HANDLING  ================== */

/**
 * เติมตัวเลือกยุทธศาสตร์ลงใน <select id="strategy">
 * เมื่อเลือกยุทธศาสตร์: เติม SO
 * เมื่อเลือก SO: เติม KPI
 */
function populateStrategyDropdowns() {
  const strategyEl = document.getElementById("strategy");
  const soEl = document.getElementById("so");
  const kpiEl = document.getElementById("kpi");

  // เคลียร์ก่อน แล้วเติมตัวเลือก
  strategyEl.innerHTML = "<option value=''>-- เลือกยุทธศาสตร์หลัก --</option>";
  Object.keys(strategies).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    strategyEl.appendChild(opt);
  });

  // เมื่อเลือกยุทธศาสตร์ -> เติม SO
  strategyEl.addEventListener("change", () => {
    soEl.innerHTML = "<option value=''>-- เลือก SO --</option>";
    kpiEl.innerHTML = "<option value=''>-- เลือก KPI --</option>";
    const selected = strategyEl.value;
    if (!selected) return;
    const soObj = strategies[selected];
    Object.keys(soObj).forEach(soKey => {
      const soOpt = document.createElement("option");
      soOpt.value = soKey;
      soOpt.textContent = soKey;
      soEl.appendChild(soOpt);
    });
  });

  // เมื่อเลือก SO -> เติม KPI
  soEl.addEventListener("change", () => {
    kpiEl.innerHTML = "<option value=''>-- เลือก KPI --</option>";
    const selectedStrategy = strategyEl.value;
    const selectedSO = soEl.value;
    if (!selectedStrategy || !selectedSO) return;
    const kpis = strategies[selectedStrategy][selectedSO] || [];
    kpis.forEach(k => {
      const kOpt = document.createElement("option");
      kOpt.value = k;
      kOpt.textContent = k;
      kpiEl.appendChild(kOpt);
    });
  });
}

/* ==================  CRUD / Apps Script Communication  ================== */

/**
 * Generic helper: call Apps Script Web App with POST action.
 * - action: create/read/update/delete/export...
 * - payload: object to send as body (JSON)
 * Returns parsed JSON if response is JSON, else text.
 */
async function callApi(action, payload = {}) {
  if (!API_URL || API_URL.includes("YOUR_WEBAPP_URL_HERE")) {
    throw new Error("กรุณาแก้ API_URL ใน script.js ให้เป็น URL ของ Web App ที่ Deploy จาก Apps Script");
  }

  const url = `${API_URL}?action=${encodeURIComponent(action)}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await resp.text();
  // พยายาม parse เป็น JSON ถ้าได้
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/* ====== Load projects from sheet and render table ====== */
async function loadProjects() {
  try {
    // เรียก API 'read' (Apps Script จะคืน JSON array)
    const data = await callApi("read", {});
    renderTable(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("loadProjects error:", err);
    alert("ไม่สามารถโหลดข้อมูลได้: " + err.message);
  }
}

/* ====== Form submit (create or update) ====== */
document.addEventListener("DOMContentLoaded", () => {
  // เตรียม dropdown
  populateStrategyDropdowns();

  // hook form submission
  const form = document.getElementById("projectForm");
  if (!form) return;

  // hidden field to hold editing row index (if editing)
  let hiddenRowInput = document.createElement("input");
  hiddenRowInput.type = "hidden";
  hiddenRowInput.name = "_rowIndex";
  form.appendChild(hiddenRowInput);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const obj = {};
    for (let [k, v] of fd.entries()) {
      obj[k] = v;
    }

    const rowIndex = obj["_rowIndex"];
    try {
      if (rowIndex !== undefined && rowIndex !== "") {
        // update
        obj.rowIndex = Number(rowIndex);
        await callApi("update", obj);
        alert("อัปเดตข้อมูลสำเร็จ");
      } else {
        // create
        await callApi("create", obj);
        alert("เพิ่มข้อมูลสำเร็จ");
      }
      form.reset();
      hiddenRowInput.value = "";
      await loadProjects();
    } catch (err) {
      console.error("submit error:", err);
      alert("บันทึกข้อมูลล้มเหลว: " + err.message);
    }
  });

  // initial load
  loadProjects();
});

/* ====== Render table ====== */
function renderTable(data) {
  const table = document.getElementById("projectTable");
  if (!table) return;

  // ถ้าไม่มีข้อมูล
  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td class="p-4">ไม่มีข้อมูล</td></tr>`;
    return;
  }

  // หาคอลัมน์ (รวม header)
  const headers = Object.keys(data[0]);

  // สร้าง thead
  const thead = `<thead class="bg-blue-200">
    <tr>
      ${headers.map(h => `<th class="border px-2 py-1 text-left">${escapeHtml(h)}</th>`).join('')}
      <th class="border px-2 py-1">จัดการ</th>
    </tr>
  </thead>`;

  // สร้าง tbody
  const tbody = data.map((row, idx) => {
    const cells = headers.map(h => `<td class="border px-2 py-1">${escapeHtml(row[h] ?? "")}</td>`).join('');
    return `<tr class="hover:bg-gray-50">
      ${cells}
      <td class="border px-2 py-1">
        <button class="btn-small" onclick="editRow(${idx})" title="แก้ไข">✏️</button>
        <button class="btn-small" onclick="deleteRow(${idx})" title="ลบ">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  table.innerHTML = thead + `<tbody>${tbody}</tbody>`;
  // store last-loaded data for edit usage
  window.__lastLoadedData = data;
}

/* ====== Edit row: เติมข้อมูลลงฟอร์มเพื่อแก้ไข ====== */
function editRow(index) {
  const data = window.__lastLoadedData;
  if (!data || !data[index]) {
    alert("ไม่พบข้อมูลที่เลือก");
    return;
  }
  const obj = data[index];
  const form = document.getElementById("projectForm");
  if (!form) return;

  // ใส่ค่าแต่ละฟิลด์ (matching by header name)
  for (const key of Object.keys(obj)) {
    // เนมของ input ตรงกับ header ใน Google Sheet ตามที่คุณตั้งไว้
    const el = form.querySelector(`[name="${cssEscape(key)}"]`);
    if (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        el.value = obj[key] ?? "";
        // ถ้าเป็นยุทธศาสตร์/so/kpi ให้ trigger change เพื่อให้ dropdown แสดงค่าที่เกี่ยวข้อง
        if (el.id === "strategy") {
          el.dispatchEvent(new Event("change"));
        }
        if (el.id === "so") {
          el.dispatchEvent(new Event("change"));
        }
      }
    }
  }

  // set hidden row index
  const hidden = form.querySelector(`input[name="_rowIndex"]`);
  if (hidden) hidden.value = index;
  // สกรอลไปยังฟอร์ม
  form.scrollIntoView({ behavior: "smooth" });
}

/* ====== Delete row ====== */
async function deleteRow(index) {
  if (!confirm("ยืนยันการลบข้อมูลรายการนี้?")) return;
  try {
    await callApi("delete", { rowIndex: index });
    alert("ลบข้อมูลสำเร็จ");
    await loadProjects();
  } catch (err) {
    console.error("deleteRow error:", err);
    alert("ลบข้อมูลล้มเหลว: " + err.message);
  }
}

/* ====== Utility helpers ====== */
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// CSS-escape for querying by name (handles special chars in header names)
function cssEscape(str) {
  // Basic replace for quotes in attribute selector
  return str.replace(/"/g, '\\"');
}

/* ==================  End of script.js  ================== */

