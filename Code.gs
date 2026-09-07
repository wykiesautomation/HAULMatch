const SHEET_ID = PropertiesService.getScriptProperties().getProperty('HAULMATCH_SHEET_ID');
const ADMIN_EMAIL = PropertiesService.getScriptProperties().getProperty('HAULMATCH_ADMIN_EMAIL');
function doGet(){return ContentService.createTextOutput('HaulMatch lead endpoint is online.');}
function doPost(e){
  try {
    const data=JSON.parse((e.parameter&&e.parameter.payload)||'{}');
    if(!data.formType||!data.reference||data.website){throw new Error('Invalid submission');}
    const lock=LockService.getScriptLock();lock.waitLock(10000);
    try {
      const ss=SpreadsheetApp.openById(SHEET_ID);
      const sheetName=data.formType==='request'?'Transport Requests':'Transporter Applications';
      const sheet=getOrCreateSheet_(ss,sheetName,data.formType);
      if(referenceExists_(sheet,data.reference)){return ContentService.createTextOutput('Duplicate ignored');}
      const row=data.formType==='request'?requestRow_(data):transporterRow_(data);
      sheet.appendRow(row);
    } finally {lock.releaseLock();}
    sendNotice_(data);
    return ContentService.createTextOutput('OK '+data.reference);
  } catch(err){console.error(err);return ContentService.createTextOutput('ERROR');}
}
function getOrCreateSheet_(ss,name,type){let sh=ss.getSheetByName(name);if(sh)return sh;sh=ss.insertSheet(name);sh.appendRow(type==='request'?['Submitted','Reference','Name','Email','Mobile','Customer Type','Transport Type','Description','Make/Model','Condition','Registration/Serial','Mass','Dimensions','Collection','Delivery','Required Date','Loading Support','Photo Link','Notes','Consent','Status']:['Submitted','Reference','Contact','Company','Email','Mobile','Business Type','Services','Service Areas','Vehicles','Payload','Lowbed','Insurance','Registration No','Experience','Notes','Consent','Status']);sh.setFrozenRows(1);return sh;}
function requestRow_(d){return [d.submittedAt,d.reference,d.fullName,d.email,d.mobile,d.customerType,d.transportType,d.itemDescription,d.makeModel,d.condition,d.registration,d.mass,d.dimensions,d.collectionTown,d.deliveryTown,d.requiredDate,d.loadingSupport,d.photoLink,d.notes,d.consent?'YES':'NO','NEW'];}
function transporterRow_(d){return [d.submittedAt,d.reference,d.fullName,d.company,d.email,d.mobile,d.businessType,d.services,d.serviceAreas,d.vehicles,d.payload,d.lowbed,d.insurance,d.registrationNumber,d.experience,d.notes,d.consent?'YES':'NO','PENDING REVIEW'];}
function referenceExists_(sheet,reference){if(sheet.getLastRow()<2)return false;return sheet.getRange(2,2,sheet.getLastRow()-1,1).getValues().flat().includes(reference);}
function sendNotice_(d){if(!ADMIN_EMAIL)return;const subject=(d.formType==='request'?'New transport request ':'New transporter application ')+d.reference;const body=JSON.stringify(d,null,2);MailApp.sendEmail(ADMIN_EMAIL,subject,body);}
function setupSheets(){const ss=SpreadsheetApp.openById(SHEET_ID);getOrCreateSheet_(ss,'Transport Requests','request');getOrCreateSheet_(ss,'Transporter Applications','transporter');}
