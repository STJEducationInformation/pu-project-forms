const sheetName = "Data";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getStrategicData") return getStrategicData();
  return ContentService.createTextOutput("Invalid request");
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sheet.appendRow([
    new Date(),
    data.projectName,
    data.projectCode,
    data.department,
    data.owner,
    data.strategy,
    data.strategicObjective,
    data.kpi,
    data.rationale,
    data.objectives,
    data.expectedResults
  ]);
  return ContentService.createTextOutput(JSON.stringify({ message: "บันทึกข้อมูลสำเร็จ!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStrategicData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName("Data");

  // สมมุติว่าข้อมูลยุทธศาสตร์เก็บไว้ในชีตชื่อ "Strategic"
  const strategicSheet = ss.getSheetByName("Strategic");
  const data = strategicSheet.getDataRange().getValues();

  const strategies = [...new Set(data.map(r => r[0]))].filter(Boolean);
  const so = data.map(r => ({ strategy: r[0], name: r[1] }));
  const kpi = data.map(r => ({ so: r[1], name: r[2] }));

  return ContentService.createTextOutput(JSON.stringify({ strategies, so, kpi }))
    .setMimeType(ContentService.MimeType.JSON);
}
