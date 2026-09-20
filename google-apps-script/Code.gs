const SHEET_ID=PropertiesService.getScriptProperties().getProperty('HAULMATCH_SHEET_ID');
const ADMIN_EMAIL=PropertiesService.getScriptProperties().getProperty('HAULMATCH_ADMIN_EMAIL');
const ADMIN_KEY=PropertiesService.getScriptProperties().getProperty('HAULMATCH_ADMIN_KEY');
const TURNSTILE_SECRET=PropertiesService.getScriptProperties().getProperty('HAULMATCH_TURNSTILE_SECRET')||'';
const DISPOSABLE=['mailinator.com','yopmail.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org','sharklasers.com','throwawaymail.com'];
const RH=['Submitted','Reference','Name','Email','Mobile','Customer Type','Transport Type','Description','Quantity','Mass','Dimensions','Collection','Delivery','Required Date','Special Handling','Category Details','Photo Link','Notes','Consent','Status','Public Note','Updated At','Risk Score','Moderation Status','Device Fingerprint'];
const TH=['Submitted','Reference','Contact','Company','Email','Mobile','Business Type','Services','Service Areas','Vehicles','Payload','Insurance','Registration No','Experience','Notes','Consent','Status','Risk Score','Moderation Status','Device Fingerprint'];
const QH=['Submitted','Quote Reference','Request Reference','Transporter Reference','Email','Mobile','Amount','Vehicle','Availability','Collection Date','Delivery Estimate','Terms','Status','Risk Score'];
function out_(data, callback) {
  const json = JSON.stringify(data);
  const requestedCallback = String(callback || '').trim();

  if (requestedCallback) {
    // JSONP callbacks are executable JavaScript. Permit only a safe identifier/path.
    const safeCallback = requestedCallback.replace(/[^A-Za-z0-9_$\.]/g, '');

    if (!safeCallback) {
      return ContentService
        .createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput('/**/' + safeCallback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const parameters = e && e.parameter ? e.parameter : {};
  const action = String(parameters.action || 'health');
  const callback = String(parameters.callback || '');

  try {
    if (action === 'adminConsole') {
      return adminConsoleV2_();
    }

    if (action === 'health') {
      return out_({
        ok: true,
        service: 'HaulMatch Trust and Moderation',
        api: 'G7',
        timestamp: new Date().toISOString()
      }, callback);
    }

    if (action === 'marketplace') {
      return out_({ ok: true, items: marketplace_() }, callback);
    }

    if (action === 'status') {
      return out_(status_(parameters.reference, parameters.email), callback);
    }

    // Legacy and current Admin Cockpit actions are both supported.
    if (action === 'admin') {
      return out_(admin_(parameters.key), callback);
    }

    if (action === 'gAdmin') {
      return out_(gAdmin_(parameters.key), callback);
    }

    if (action === 'moderation') {
      return out_(moderation_(parameters.key), callback);
    }

    if (action === 'gLeads') {
      return out_({ ok: true, items: gLeads_() }, callback);
    }

    if (action === 'gWallet') {
      return out_(gWallet_(parameters.transporterReference, parameters.email), callback);
    }

    if (action === 'gUnlock') {
      return out_(gUnlock_(parameters.reference, parameters.transporterReference, parameters.email), callback);
    }

    if (action === 'gPro') {
      return out_(gPro_(parameters.transporterReference, parameters.email), callback);
    }

    if (action === 'gCustomerQuotes') {
      return out_(gCustomerQuotes_(parameters.reference, parameters.email), callback);
    }

    if (action === 'gAppointments') {
      return out_(gAppointments_(parameters.reference, parameters.email), callback);
    }

    if (action === 'g6Packs') {
      return out_({ ok: true, items: g6Packs_() }, callback);
    }

    if (action === 'g6Wallet') {
      return out_(g6Wallet_(parameters.transporterReference, parameters.email), callback);
    }

    if (action === 'g6Documents') {
      return out_(g6Documents_(parameters.transporterReference, parameters.email), callback);
    }

    if (action === 'g6Admin') {
      return out_(g6Admin_(parameters.key), callback);
    }

    if (action === 'g6Reconcile') {
      return out_(g6Reconcile_(parameters.key), callback);
    }

    return out_({ ok: false, error: 'Unknown action: ' + action }, callback);
  } catch (error) {
    console.error('doGet failed', action, error);
    return out_({
      ok: false,
      error: error && error.message ? error.message : String(error),
      action: action
    }, callback);
  }
}

function doPost(e){try{const parameters=e&&e.parameter?e.parameter:{};if(parameters.formType==='apiQuery')return apiQueryPostMessage_(parameters);if(parameters.formType==='adminGoogleAuth')return adminGoogleLoginPost_(parameters);if(parameters.formType==='adminConsoleForm')return adminConsoleRoutePost_(parameters);const d=JSON.parse(parameters.payload||'{}');if(d.formType==='adminQuery')return adminPostMessage_(gAdmin_(d.key));if(!d.formType||!d.reference||d.website)throw Error('Invalid submission');if(['request','transporter'].includes(d.formType)&&!verifyTurnstile_(d.turnstileToken))throw Error('Bot verification failed');const ss=SpreadsheetApp.openById(SHEET_ID);if(d.formType==='request'){d.photoLink=g7SaveUploads_(ss,d.uploads||[],d.reference,d.photoLink||'');delete d.uploads;saveRequest_(ss,d);}else if(d.formType==='transporter')saveTransporter_(ss,d);else if(d.formType==='quote')saveQuote_(ss,d);else if(d.formType==='adminAction')adminAction_(ss,d);else if(d.formType==='moderationAction')moderationAction_(ss,d);else if(d.formType==='transporterDecision')transporterDecision_(ss,d);else if(d.formType==='gSetCost')gSetCost_(ss,d);else if(d.formType==='gQuoteDecision')gQuoteDecision_(ss,d);else if(d.formType==='gFeedback')gFeedback_(ss,d);else if(d.formType==='g6CreateOrder')g6CreateOrder_(ss,d);else if(d.formType==='g6PaymentDecision')g6PaymentDecision_(ss,d);else if(d.formType==='g6WalletAdjust')g6WalletAdjust_(ss,d);else if(d.formType==='g6RefundRequest')g6RefundRequest_(ss,d);else if(d.formType==='g6RefundDecision')g6RefundDecision_(ss,d);else if(d.formType==='g6GenerateDocuments')g6GenerateDocuments_(ss,d);else if(d.formType==='g6Statement')g6Statement_(ss,d);else throw Error('Unsupported form');if(d.responseMode==='postMessage')return g7PostMessage_(true,d.reference,'');return out_({ok:true,reference:d.reference})}catch(x){console.error(x);try{const parameters=e&&e.parameter?e.parameter:{};const d=JSON.parse(parameters.payload||'{}');if(d.formType==='adminQuery')return adminPostMessage_({ok:false,error:x.message});if(d.responseMode==='postMessage')return g7PostMessage_(false,'',x.message)}catch(ignore){}return out_({ok:false,error:x.message})}}
function verifyTurnstile_(token){if(!TURNSTILE_SECRET)return true;if(!token)return false;const r=UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'post',payload:{secret:TURNSTILE_SECRET,response:token},muteHttpExceptions:true});return JSON.parse(r.getContentText()).success===true}
function sheet_(ss,n,h){let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);if(s.getLastRow()===0){s.appendRow(h);s.setFrozenRows(1)}else ensureHeaders_(s,h);return s}
function ensureHeaders_(s,h){const old=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0];h.forEach(x=>{if(!old.includes(x))s.getRange(1,s.getLastColumn()+1).setValue(x)})}
function emailRisk_(email){const d=String(email||'').toLowerCase().split('@')[1]||'';return DISPOSABLE.includes(d)?50:0}
function duplicateCount_(s,value,col){if(!value||s.getLastRow()<2)return 0;return s.getRange(2,col,s.getLastRow()-1,1).getDisplayValues().flat().filter(x=>String(x).toLowerCase()===String(value).toLowerCase()).length}
function contentRisk_(text){return /crypto|bitcoin|gift card|pay before|deposit first|whatsapp only|urgent payment/i.test(String(text||''))?35:0}
function riskRequest_(s,d){let score=emailRisk_(d.email)+contentRisk_(d.itemDescription+' '+d.notes);if(duplicateCount_(s,d.mobile,5)>=2)score+=30;if(duplicateCount_(s,d.email,4)>=3)score+=20;if(duplicateCount_(s,d.deviceFingerprint,25)>=5)score+=25;return Math.min(100,score)}
function riskTransporter_(s,d){let score=emailRisk_(d.email)+contentRisk_(d.notes);if(duplicateCount_(s,d.mobile,6)>=2)score+=30;if(String(d.insurance).toLowerCase()==='no')score+=15;return Math.min(100,score)}
function saveRequest_(ss,d){const s=sheet_(ss,'Transport Requests',RH);if(find_(s,d.reference,2))return;const risk=riskRequest_(s,d),mod=risk>=50?'REVIEW REQUIRED':'PENDING REVIEW';s.appendRow([d.submittedAt,d.reference,d.fullName,d.email,d.mobile,d.customerType,d.transportType,d.itemDescription,d.quantity,d.mass,d.dimensions,d.collectionTown,d.deliveryTown,d.requiredDate,d.specialHandling,d.categoryDetails,d.photoLink,d.notes,d.consent?'YES':'NO','NEW','Request received',new Date(),risk,mod,d.deviceFingerprint]);history_(ss,d.reference,'NEW','Request submitted');audit_(ss,'REQUEST_CREATED',d.reference,'risk='+risk);if(risk>=50)flag_(ss,d.reference,risk>=75?'HIGH':'MEDIUM','AUTOMATED_REQUEST_RISK','Open','Automated trust checks');mail_(d.email,'HaulMatch request received '+d.reference,'Reference: '+d.reference+'\nStatus: NEW\nModeration: '+mod);mail_(ADMIN_EMAIL,'New HaulMatch request '+d.reference,'Risk score: '+risk+'\n'+JSON.stringify(d,null,2))}
function saveTransporter_(ss,d){const s=sheet_(ss,'Transporter Applications',TH);if(find_(s,d.reference,2))return;const risk=riskTransporter_(s,d),mod=risk>=40?'REVIEW REQUIRED':'PENDING REVIEW';s.appendRow([d.submittedAt,d.reference,d.fullName,d.company,d.email,d.mobile,d.businessType,d.services,d.serviceAreas,d.vehicles,d.payload,d.insurance,d.registrationNumber,d.experience,d.notes,d.consent?'YES':'NO','PENDING REVIEW',risk,mod,d.deviceFingerprint]);audit_(ss,'TRANSPORTER_APPLIED',d.reference,'risk='+risk);if(risk>=40)flag_(ss,d.reference,risk>=70?'HIGH':'MEDIUM','TRANSPORTER_RISK','Open','Automated trust checks');mail_(d.email,'HaulMatch transporter application '+d.reference,'Reference: '+d.reference+'\nStatus: PENDING REVIEW')}
function saveQuote_(ss,d){const rs=sheet_(ss,'Transport Requests',RH),rr=find_(rs,d.requestReference,2);if(!rr||rs.getRange(rr,20).getDisplayValue()!=='PUBLISHED')throw Error('Request is not open');const ts=sheet_(ss,'Transporter Applications',TH),tr=find_(ts,d.transporterReference,2);if(!tr||ts.getRange(tr,17).getDisplayValue()!=='APPROVED'||ts.getRange(tr,19).getDisplayValue()==='BLOCKED')throw Error('Approved transporter required');const risk=emailRisk_(d.email)+contentRisk_(d.terms);const s=sheet_(ss,'Quotes',QH);if(find_(s,d.reference,2))return;s.appendRow([d.submittedAt,d.reference,d.requestReference,d.transporterReference,d.email,d.mobile,d.amount,d.vehicle,d.availability,d.collectionDate,d.deliveryEstimate,d.terms,risk>=50?'HELD FOR REVIEW':'SUBMITTED',risk]);if(risk>=50)flag_(ss,d.reference,'HIGH','QUOTE_RISK','Open','Quote held for moderation');history_(ss,d.requestReference,'QUOTE RECEIVED','Transporter response received');audit_(ss,'QUOTE_SUBMITTED',d.reference,'risk='+risk);mail_(ADMIN_EMAIL,'New HaulMatch quote '+d.reference,JSON.stringify(d,null,2))}
function marketplace_(){const ss=SpreadsheetApp.openById(SHEET_ID),s=sheet_(ss,'Transport Requests',RH),v=s.getDataRange().getDisplayValues();return v.slice(1).filter(r=>r[19]==='PUBLISHED'&&r[23]!=='BLOCKED').map(r=>({reference:r[1],transportType:r[6],description:r[7],quantity:r[8],mass:r[9],dimensions:r[10],collection:r[11],delivery:r[12],requiredDate:r[13],specialHandling:r[14],status:r[19],publicNote:r[20]}))}
function status_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),s=sheet_(ss,'Transport Requests',RH),r=find_(s,String(ref||'').toUpperCase(),2);if(!r)return {ok:false,error:'Request not found'};if(s.getRange(r,4).getDisplayValue().toLowerCase()!==String(email||'').toLowerCase())return {ok:false,error:'Reference and email do not match'};const qs=sheet_(ss,'Quotes',QH),qc=qs.getLastRow()<2?0:qs.getRange(2,3,qs.getLastRow()-1,1).getDisplayValues().flat().filter(x=>x===ref).length;return {ok:true,reference:ref,status:s.getRange(r,20).getDisplayValue(),transportType:s.getRange(r,7).getDisplayValue(),collection:s.getRange(r,12).getDisplayValue(),delivery:s.getRange(r,13).getDisplayValue(),publicNote:s.getRange(r,21).getDisplayValue(),quoteCount:qc}}
function admin_(key){checkAdmin_(key);const ss=SpreadsheetApp.openById(SHEET_ID),r=sheet_(ss,'Transport Requests',RH),t=sheet_(ss,'Transporter Applications',TH),q=sheet_(ss,'Quotes',QH),rv=r.getDataRange().getDisplayValues(),tv=t.getDataRange().getDisplayValues();return {ok:true,counts:{newRequests:rv.slice(1).filter(x=>x[19]==='NEW').length,published:rv.slice(1).filter(x=>x[19]==='PUBLISHED').length,pendingTransporters:tv.slice(1).filter(x=>x[16]==='PENDING REVIEW').length,quotes:Math.max(0,q.getLastRow()-1)},requests:rv.slice(1).filter(x=>!['CLOSED','REJECTED'].includes(x[19])).slice(-50).reverse().map(x=>({reference:x[1],transportType:x[6],collection:x[11],delivery:x[12],status:x[19]}))}}
function moderation_(key){checkAdmin_(key);const ss=SpreadsheetApp.openById(SHEET_ID),f=sheet_(ss,'Risk Flags',['Timestamp','Reference','Severity','Rule','Status','Note']),t=sheet_(ss,'Transporter Applications',TH),fv=f.getDataRange().getDisplayValues(),tv=t.getDataRange().getDisplayValues();return {ok:true,flags:fv.slice(1).filter(x=>x[4]==='Open').map(x=>({reference:x[1],severity:x[2],rule:x[3],note:x[5]})),transporters:tv.slice(1).filter(x=>['PENDING REVIEW','MORE INFO REQUIRED'].includes(x[16])).map(x=>({reference:x[1],company:x[3],services:x[7],risk:x[17]}))}}
function adminAction_(ss,d){checkAdmin_(d.key);const s=sheet_(ss,'Transport Requests',RH),r=find_(s,d.reference,2);if(!r)throw Error('Not found');if(d.status==='PUBLISHED'&&Number(s.getRange(r,23).getValue())>=75)throw Error('High-risk request must be cleared first');if(s.getRange(r,24).getDisplayValue()==='BLOCKED')throw Error('Blocked request cannot publish');s.getRange(r,20).setValue(d.status);s.getRange(r,22).setValue(new Date());history_(ss,d.reference,d.status,'Admin update');audit_(ss,'STATUS_CHANGED',d.reference,d.status);mail_(s.getRange(r,4).getValue(),'HaulMatch request update '+d.reference,'Status: '+d.status)}
function moderationAction_(ss,d){checkAdmin_(d.key);const f=sheet_(ss,'Risk Flags',['Timestamp','Reference','Severity','Rule','Status','Note']);for(let r=2;r<=f.getLastRow();r++)if(f.getRange(r,2).getDisplayValue()===d.reference&&f.getRange(r,5).getDisplayValue()==='Open')f.getRange(r,5).setValue(d.status);const rs=sheet_(ss,'Transport Requests',RH),rr=find_(rs,d.reference,2);if(rr)rs.getRange(rr,24).setValue(d.status);const ts=sheet_(ss,'Transporter Applications',TH),tr=find_(ts,d.reference,2);if(tr)ts.getRange(tr,19).setValue(d.status);audit_(ss,'MODERATION_'+d.status,d.reference,'admin')}
function transporterDecision_(ss,d){checkAdmin_(d.key);const s=sheet_(ss,'Transporter Applications',TH),r=find_(s,d.reference,2);if(!r)throw Error('Not found');if(d.status==='APPROVED'&&s.getRange(r,19).getDisplayValue()==='BLOCKED')throw Error('Clear block first');s.getRange(r,17).setValue(d.status);if(d.status==='APPROVED')gEnsureWallet_(ss,d.reference,s.getRange(r,5).getDisplayValue(),10);audit_(ss,'TRANSPORTER_'+d.status,d.reference,'admin');mail_(s.getRange(r,5).getValue(),'HaulMatch application update '+d.reference,'Status: '+d.status)}
function checkAdmin_(k){if(!ADMIN_KEY||k!==ADMIN_KEY)throw Error('Invalid admin key')}
function flag_(ss,ref,severity,rule,status,note){sheet_(ss,'Risk Flags',['Timestamp','Reference','Severity','Rule','Status','Note']).appendRow([new Date(),ref,severity,rule,status,note])}
function history_(ss,ref,status,note){sheet_(ss,'Status History',['Timestamp','Reference','Status','Note']).appendRow([new Date(),ref,status,note])}
function audit_(ss,event,ref,detail){sheet_(ss,'Audit Log',['Timestamp','Event','Reference','Detail']).appendRow([new Date(),event,ref,detail])}
function mail_(to,sub,body){if(to)MailApp.sendEmail(to,sub,body)}function find_(s,v,c){if(s.getLastRow()<2)return 0;const a=s.getRange(2,c,s.getLastRow()-1,1).getDisplayValues().flat();const i=a.indexOf(v);return i<0?0:i+2}
function upgradeTrustSheets(){const ss=SpreadsheetApp.openById(SHEET_ID);sheet_(ss,'Transport Requests',RH);sheet_(ss,'Transporter Applications',TH);sheet_(ss,'Quotes',QH);sheet_(ss,'Status History',['Timestamp','Reference','Status','Note']);sheet_(ss,'Risk Flags',['Timestamp','Reference','Severity','Rule','Status','Note']);sheet_(ss,'Audit Log',['Timestamp','Event','Reference','Detail']);sheet_(ss,'Blocked Identities',['Type','Value','Reason','Status']);sheet_(ss,'Settings',['Key','Value']);}


function gLeadSettings_(ss){return sheet_(ss,'Lead Settings',['Request Reference','Lead Cost','Response Count','Response Limit','Updated At'])}
function gWallets_(ss){return sheet_(ss,'Test Wallets',['Transporter Reference','Email','Credits','Opening Credits','Updated At'])}
function gUnlocks_(ss){return sheet_(ss,'Lead Unlocks',['Timestamp','Unlock Reference','Request Reference','Transporter Reference','Email','Credits Used','Balance After','Status'])}
function gDecisions_(ss){return sheet_(ss,'Quote Decisions',['Timestamp','Quote Reference','Request Reference','Customer Email','Status'])}
function gAppointmentsSheet_(ss){return sheet_(ss,'Appointments',['Timestamp','Appointment Reference','Request Reference','Quote Reference','Transporter Reference','Customer Email','Status'])}
function gFeedbackSheet_(ss){return sheet_(ss,'Tester Feedback',['Timestamp','Reference','Page','Device','Expected','Actual','Screenshot Link','Status'])}
function gSetting_(ss,ref){const s=gLeadSettings_(ss),r=find_(s,ref,1);if(r)return {s:s,r:r,cost:Number(s.getRange(r,2).getValue()||2),count:Number(s.getRange(r,3).getValue()||0),limit:Number(s.getRange(r,4).getValue()||6)};s.appendRow([ref,2,0,6,new Date()]);return {s:s,r:s.getLastRow(),cost:2,count:0,limit:6}}
function gEnsureWallet_(ss,ref,email,credits){const s=gWallets_(ss),r=find_(s,ref,1);if(r)return r;s.appendRow([ref,String(email||'').toLowerCase(),credits,credits,new Date()]);return s.getLastRow()}
function gTransporter_(ss,ref,email){const s=sheet_(ss,'Transporter Applications',TH),r=find_(s,String(ref||'').toUpperCase(),2);if(!r||s.getRange(r,17).getDisplayValue()!=='APPROVED'||s.getRange(r,5).getDisplayValue().toLowerCase()!==String(email||'').toLowerCase())return null;return {row:r,company:s.getRange(r,4).getDisplayValue()||s.getRange(r,3).getDisplayValue()}}
function gPublicPhoto_(value){
  const first=String(value||'').split(',')[0].trim();
  if(!first)return '';
  const match=first.match(/(?:\/d\/|id=)([-_A-Za-z0-9]{20,})/);
  if(!match)return '';
  try{
    const file=DriveApp.getFileById(match[1]);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return 'https://drive.google.com/thumbnail?id='+match[1]+'&sz=w1200';
  }catch(error){
    console.warn('Public lead photo sharing failed',error);
    return '';
  }
}
function gPhotoForRequest_(ss,requestRef,fallback){
  const direct=gPublicPhoto_(fallback);
  if(direct)return direct;
  const uploads=sheet_(ss,'Request Uploads',['Timestamp','Upload Reference','Request Reference','Kind','Position','Original Name','MIME Type','Bytes','Drive File ID','Drive URL','Status']);
  if(uploads.getLastRow()<2)return '';
  const rows=uploads.getRange(2,1,uploads.getLastRow()-1,uploads.getLastColumn()).getDisplayValues();
  const match=rows.filter(function(x){return x[2]===requestRef&&x[3]==='LOAD_PHOTO'&&x[10]==='STORED'&&x[8];}).sort(function(a,b){return Number(a[4]||0)-Number(b[4]||0);})[0];
  if(!match)return '';
  try{
    const file=DriveApp.getFileById(match[8]);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return 'https://drive.google.com/thumbnail?id='+match[8]+'&sz=w1200';
  }catch(error){
    console.warn('Request Upload photo lookup failed',requestRef,error);
    return '';
  }
}
function gLeads_(){const ss=SpreadsheetApp.openById(SHEET_ID),s=sheet_(ss,'Transport Requests',RH),v=s.getDataRange().getDisplayValues();return v.slice(1).filter(r=>r[19]==='PUBLISHED'&&r[23]!=='BLOCKED').map(r=>{const m=gSetting_(ss,r[1]);return {reference:r[1],transportType:r[6],description:r[7],quantity:r[8],mass:r[9],dimensions:r[10],collection:r[11],delivery:r[12],requiredDate:r[13],specialHandling:r[14],photoLink:gPhotoForRequest_(ss,r[1],r[16]),leadCost:m.cost,responseCount:m.count,responseLimit:m.limit}}).filter(x=>x.responseCount<x.responseLimit)}

function repairPublishedLeadPhotos(){
  const ss=SpreadsheetApp.openById(SHEET_ID),requests=sheet_(ss,'Transport Requests',RH);
  const rows=requests.getDataRange().getDisplayValues();
  let repaired=0,missing=0;
  rows.slice(1).forEach(function(r,i){
    if(r[19]!=='PUBLISHED')return;
    const photo=gPhotoForRequest_(ss,r[1],r[16]);
    if(photo){
      if(!r[16])requests.getRange(i+2,17).setValue(photo);
      repaired++;
    }else missing++;
  });
  console.log('Published lead photos available: '+repaired+'; missing: '+missing);
}
function gWallet_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),t=gTransporter_(ss,ref,email);if(!t)return {ok:false,error:'Approved transporter reference and email do not match'};const s=gWallets_(ss),r=gEnsureWallet_(ss,String(ref).toUpperCase(),String(email).toLowerCase(),10);return {ok:true,company:t.company,credits:Number(s.getRange(r,3).getValue()||0)}}
function gUnlock_(requestRef,trRef,email){const lock=LockService.getScriptLock();lock.waitLock(10000);try{const ss=SpreadsheetApp.openById(SHEET_ID),t=gTransporter_(ss,trRef,email);if(!t)return {ok:false,error:'Approved transporter reference and email do not match'};const rs=sheet_(ss,'Transport Requests',RH),rr=find_(rs,String(requestRef||'').toUpperCase(),2);if(!rr||rs.getRange(rr,20).getDisplayValue()!=='PUBLISHED')return {ok:false,error:'Lead is not open'};const us=gUnlocks_(ss),rows=us.getLastRow()>1?us.getRange(2,3,us.getLastRow()-1,3).getDisplayValues():[],dupe=rows.some(x=>x[0]===requestRef&&x[1]===trRef&&x[2].toLowerCase()===String(email).toLowerCase());const ws=gWallets_(ss),wr=gEnsureWallet_(ss,String(trRef).toUpperCase(),String(email).toLowerCase(),10),m=gSetting_(ss,requestRef);let credits=Number(ws.getRange(wr,3).getValue()||0);if(!dupe){if(m.count>=m.limit)return {ok:false,error:'Lead response limit reached'};if(credits<m.cost)return {ok:false,error:'Insufficient test credits'};credits-=m.cost;ws.getRange(wr,3).setValue(credits);g6Ledger_(ss).appendRow([new Date(),'HML-'+Utilities.getUuid().slice(0,10).toUpperCase(),trRef,'DEBIT',m.cost,credits+m.cost,credits,'LEAD_UNLOCK','Unlock '+requestRef,'','',trRef]);ws.getRange(wr,5).setValue(new Date());m.s.getRange(m.r,3).setValue(m.count+1);m.s.getRange(m.r,5).setValue(new Date());us.appendRow([new Date(),'HMU-'+Utilities.getUuid().slice(0,8).toUpperCase(),requestRef,trRef,String(email).toLowerCase(),m.cost,credits,'UNLOCKED']);audit_(ss,'LEAD_UNLOCKED',requestRef,trRef+' cost='+m.cost)}return {ok:true,customerName:rs.getRange(rr,3).getDisplayValue(),email:rs.getRange(rr,4).getDisplayValue(),mobile:rs.getRange(rr,5).getDisplayValue(),collection:rs.getRange(rr,12).getDisplayValue(),delivery:rs.getRange(rr,13).getDisplayValue(),credits:credits}}finally{lock.releaseLock()}}
function gPro_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),t=gTransporter_(ss,ref,email);if(!t)return {ok:false,error:'Approved transporter reference and email do not match'};const ws=gWallets_(ss),wr=gEnsureWallet_(ss,ref,email,10),u=gUnlocks_(ss),q=sheet_(ss,'Quotes',QH),a=gAppointmentsSheet_(ss);const unlocks=u.getLastRow()>1?u.getRange(2,4,u.getLastRow()-1,1).getDisplayValues().flat().filter(x=>x===ref).length:0,quotes=q.getLastRow()>1?q.getRange(2,4,q.getLastRow()-1,1).getDisplayValues().flat().filter(x=>x===ref).length:0,apps=a.getLastRow()>1?a.getRange(2,5,a.getLastRow()-1,1).getDisplayValues().flat().filter(x=>x===ref).length:0;return {ok:true,company:t.company,credits:Number(ws.getRange(wr,3).getValue()||0),unlocks:unlocks,quotes:quotes,shortlisted:0,appointed:apps}}
function gCustomerQuotes_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),rs=sheet_(ss,'Transport Requests',RH),rr=find_(rs,String(ref||'').toUpperCase(),2);if(!rr||rs.getRange(rr,4).getDisplayValue().toLowerCase()!==String(email||'').toLowerCase())return {ok:false,error:'Request reference and email do not match'};const q=sheet_(ss,'Quotes',QH),t=sheet_(ss,'Transporter Applications',TH),d=gDecisions_(ss),dv=d.getDataRange().getDisplayValues();if(q.getLastRow()<2)return {ok:true,items:[]};return {ok:true,items:q.getRange(2,1,q.getLastRow()-1,q.getLastColumn()).getDisplayValues().filter(x=>x[2]===ref).map(x=>{const tr=find_(t,x[3],2),decision=dv.slice(1).filter(y=>y[1]===x[1]).slice(-1)[0];return {reference:x[1],transporterReference:x[3],company:tr?t.getRange(tr,4).getDisplayValue():'',amount:x[6],vehicle:x[7],terms:x[11],status:decision?decision[4]:x[12]}})}}
function gQuoteDecision_(ss,d){const rs=sheet_(ss,'Transport Requests',RH),rr=find_(rs,d.requestReference,2);if(!rr||rs.getRange(rr,4).getDisplayValue().toLowerCase()!==String(d.email||'').toLowerCase())throw Error('Request reference and email do not match');if(!['SHORTLISTED','APPOINTED','REJECTED'].includes(d.status))throw Error('Invalid decision');gDecisions_(ss).appendRow([new Date(),d.quoteReference,d.requestReference,String(d.email).toLowerCase(),d.status]);if(d.status==='APPOINTED'){const q=sheet_(ss,'Quotes',QH),qr=find_(q,d.quoteReference,2);if(!qr)throw Error('Quote not found');const tr=q.getRange(qr,4).getDisplayValue();gAppointmentsSheet_(ss).appendRow([new Date(),'HMA-'+Utilities.getUuid().slice(0,8).toUpperCase(),d.requestReference,d.quoteReference,tr,String(d.email).toLowerCase(),'APPOINTED']);rs.getRange(rr,20).setValue('AWARDED')}audit_(ss,'QUOTE_'+d.status,d.quoteReference,d.requestReference)}
function gAppointments_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),a=gAppointmentsSheet_(ss),r=sheet_(ss,'Transport Requests',RH),q=sheet_(ss,'Quotes',QH),t=sheet_(ss,'Transporter Applications',TH);if(a.getLastRow()<2)return {ok:true,items:[]};return {ok:true,items:a.getRange(2,1,a.getLastRow()-1,a.getLastColumn()).getDisplayValues().filter(x=>(x[2]===ref&&x[5]===String(email).toLowerCase())||(x[4]===ref&&gTransporter_(ss,ref,email))).map(x=>{const rr=find_(r,x[2],2),qr=find_(q,x[3],2),tr=find_(t,x[4],2);return {requestReference:x[2],status:x[6],transportType:rr?r.getRange(rr,7).getDisplayValue():'',collection:rr?r.getRange(rr,12).getDisplayValue():'',delivery:rr?r.getRange(rr,13).getDisplayValue():'',company:tr?t.getRange(tr,4).getDisplayValue():'',amount:qr?q.getRange(qr,7).getDisplayValue():''}})}}
function gFeedback_(ss,d){gFeedbackSheet_(ss).appendRow([d.submittedAt,d.reference,d.page,d.device,d.expected,d.actual,d.screenshot,'OPEN']);audit_(ss,'TEST_FEEDBACK',d.reference,d.page)}
function gAdmin_(key){checkAdmin_(key);const ss=SpreadsheetApp.openById(SHEET_ID),r=sheet_(ss,'Transport Requests',RH),rv=r.getDataRange().getDisplayValues(),u=gUnlocks_(ss),q=sheet_(ss,'Quotes',QH),a=gAppointmentsSheet_(ss),f=gFeedbackSheet_(ss);return {ok:true,published:rv.slice(1).filter(x=>x[19]==='PUBLISHED').length,unlocks:Math.max(0,u.getLastRow()-1),quotes:Math.max(0,q.getLastRow()-1),appointments:Math.max(0,a.getLastRow()-1),issues:f.getLastRow()>1?f.getRange(2,8,f.getLastRow()-1,1).getDisplayValues().flat().filter(x=>x==='OPEN').length:0,requests:rv.slice(1).filter(x=>!['CLOSED','REJECTED'].includes(x[19])).reverse().slice(0,60).map(x=>{const m=gSetting_(ss,x[1]);return {reference:x[1],transportType:x[6],collection:x[11],delivery:x[12],status:x[19],cost:m.cost,responses:m.count}})}}
function gSetCost_(ss,d){checkAdmin_(d.key);const n=Number(d.cost);if(n<1||n>5)throw Error('Cost must be 1 to 5');const m=gSetting_(ss,d.reference);m.s.getRange(m.r,2).setValue(n);m.s.getRange(m.r,5).setValue(new Date());audit_(ss,'LEAD_COST_CHANGED',d.reference,String(n))}
function upgradeG1ToG5Sheets(){const ss=SpreadsheetApp.openById(SHEET_ID);sheet_(ss,'Transport Requests',RH);sheet_(ss,'Transporter Applications',TH);sheet_(ss,'Quotes',QH);gLeadSettings_(ss);gWallets_(ss);gUnlocks_(ss);gDecisions_(ss);gAppointmentsSheet_(ss);gFeedbackSheet_(ss);sheet_(ss,'Status History',['Timestamp','Reference','Status','Note']);sheet_(ss,'Risk Flags',['Timestamp','Reference','Severity','Rule','Status','Note']);sheet_(ss,'Audit Log',['Timestamp','Event','Reference','Detail']);sheet_(ss,'Blocked Identities',['Type','Value','Reason','Status']);sheet_(ss,'Settings',['Key','Value']);}


function g6PacksSheet_(ss){return sheet_(ss,'Credit Packs',['Code','Name','Credits','Price ZAR','Description','Active','Sort Order'])}
function g6Orders_(ss){return sheet_(ss,'Payment Orders',['Timestamp','Payment Reference','Transporter Reference','Email','Pack Code','Credits','Amount ZAR','Status','Credited','Completed At','Failure Reason'])}
function g6Ledger_(ss){return sheet_(ss,'Wallet Ledger',['Timestamp','Ledger Reference','Transporter Reference','Direction','Credits','Balance Before','Balance After','Type','Reason','Payment Reference','Refund Reference','Admin'])}
function g6Docs_(ss){return sheet_(ss,'Finance Documents',['Timestamp','Document Reference','Transporter Reference','Type','Description','Amount ZAR','Payment Reference','Refund Reference','PDF URL','Status'])}
function g6Refunds_(ss){return sheet_(ss,'Refund Requests',['Timestamp','Refund Reference','Payment Reference','Transporter Reference','Email','Reason','Status','Credits Refunded','Decision At','Admin Note'])}
function g6Recon_(ss){return sheet_(ss,'Finance Reconciliation',['Timestamp','Opening Credits','Credits Issued','Unlock Debits','Adjustments and Refunds','Expected Closing','Actual Closing','Balanced','Reviewer'])}
function g6EnsurePacks_(ss){const s=g6PacksSheet_(ss);if(s.getLastRow()<2){s.appendRow(['STARTER','Starter',10,300,'Test starter pack',true,1]);s.appendRow(['GROWTH','Growth',25,675,'Test growth pack',true,2]);s.appendRow(['FLEET','Fleet',50,1200,'Test fleet pack',true,3])}return s}
function g6Packs_(){const ss=SpreadsheetApp.openById(SHEET_ID),s=g6EnsurePacks_(ss),v=s.getDataRange().getDisplayValues();return v.slice(1).filter(x=>String(x[5]).toLowerCase()!=='false').sort((a,b)=>Number(a[6])-Number(b[6])).map(x=>({code:x[0],name:x[1],credits:Number(x[2]),price:Number(x[3]),description:x[4]}))}
function g6Pack_(ss,code){const s=g6EnsurePacks_(ss),r=find_(s,code,1);if(!r||String(s.getRange(r,6).getValue()).toLowerCase()==='false')throw Error('Credit pack unavailable');return {code:code,name:s.getRange(r,2).getDisplayValue(),credits:Number(s.getRange(r,3).getValue()),price:Number(s.getRange(r,4).getValue()),description:s.getRange(r,5).getDisplayValue()}}
function g6LedgerPost_(ss,ref,credits,direction,type,reason,payment,refund,admin){const w=gWallets_(ss),wr=find_(w,ref,1);if(!wr)throw Error('Wallet not found');const before=Number(w.getRange(wr,3).getValue()||0),after=before+(direction==='CREDIT'?credits:-credits);if(after<0)throw Error('Insufficient credits');w.getRange(wr,3).setValue(after);w.getRange(wr,5).setValue(new Date());g6Ledger_(ss).appendRow([new Date(),'HML-'+Utilities.getUuid().slice(0,10).toUpperCase(),ref,direction,credits,before,after,type,reason,payment||'',refund||'',admin||'']);return after}
function g6CreateOrder_(ss,d){const t=gTransporter_(ss,d.transporterReference,d.email);if(!t)throw Error('Approved transporter reference and email do not match');const pack=g6Pack_(ss,d.packCode),s=g6Orders_(ss);if(find_(s,d.reference,2))return;s.appendRow([d.submittedAt,d.reference,d.transporterReference,String(d.email).toLowerCase(),pack.code,pack.credits,pack.price,'PENDING','NO','','']);audit_(ss,'PAYMENT_ORDER_CREATED',d.reference,pack.code)}
function g6PaymentDecision_(ss,d){checkAdmin_(d.key);const s=g6Orders_(ss),r=find_(s,d.reference,2);if(!r)throw Error('Payment order not found');const current=s.getRange(r,8).getDisplayValue(),credited=s.getRange(r,9).getDisplayValue()==='YES';if(d.status==='COMPLETE'&&!credited){const tr=s.getRange(r,3).getDisplayValue(),credits=Number(s.getRange(r,6).getValue());g6LedgerPost_(ss,tr,credits,'CREDIT','PURCHASE_CREDIT','Sandbox payment '+d.reference,d.reference,'',d.key);s.getRange(r,8,1,3).setValues([['COMPLETE','YES',new Date()]]);g6CreatePaymentDocs_(ss,d.reference)}else if(d.status==='FAILED'&&!credited){s.getRange(r,8).setValue('FAILED');s.getRange(r,11).setValue('Marked failed in sandbox')}audit_(ss,'PAYMENT_'+d.status,d.reference,current)}
function g6Wallet_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),t=gTransporter_(ss,ref,email);if(!t)return {ok:false,error:'Approved transporter reference and email do not match'};const w=gWallets_(ss),wr=gEnsureWallet_(ss,ref,email,10),l=g6Ledger_(ss),rows=l.getLastRow()>1?l.getRange(2,1,l.getLastRow()-1,l.getLastColumn()).getDisplayValues().filter(x=>x[2]===ref).reverse().slice(0,100):[];return {ok:true,company:t.company,credits:Number(w.getRange(wr,3).getValue()||0),ledger:rows.map(x=>({date:x[0],direction:x[3],credits:x[4],balance:x[6],type:x[7],reason:x[8]}))}}
function g6WalletAdjust_(ss,d){checkAdmin_(d.key);if(!d.reason||!Number.isFinite(Number(d.credits))||Number(d.credits)===0)throw Error('Valid credits and reason required');const n=Math.abs(Number(d.credits)),dir=Number(d.credits)>0?'CREDIT':'DEBIT';g6LedgerPost_(ss,d.transporterReference,n,dir,'ADMIN_ADJUSTMENT',d.reason,'','',d.key);audit_(ss,'WALLET_ADJUSTMENT',d.transporterReference,d.credits+' '+d.reason)}
function g6RefundRequest_(ss,d){const t=gTransporter_(ss,d.transporterReference,d.email);if(!t)throw Error('Approved transporter reference and email do not match');const o=g6Orders_(ss),or=find_(o,d.paymentReference,2);if(!or||o.getRange(or,3).getDisplayValue()!==d.transporterReference||o.getRange(or,8).getDisplayValue()!=='COMPLETE')throw Error('Completed payment order not found');const s=g6Refunds_(ss);if(find_(s,d.reference,2))return;s.appendRow([d.submittedAt,d.reference,d.paymentReference,d.transporterReference,String(d.email).toLowerCase(),d.reason,'OPEN',0,'','']);audit_(ss,'REFUND_REQUESTED',d.reference,d.paymentReference)}
function g6RefundDecision_(ss,d){checkAdmin_(d.key);const s=g6Refunds_(ss),r=find_(s,d.reference,2);if(!r||s.getRange(r,7).getDisplayValue()!=='OPEN')throw Error('Open refund request not found');if(d.status==='APPROVED'){const pay=s.getRange(r,3).getDisplayValue(),tr=s.getRange(r,4).getDisplayValue(),o=g6Orders_(ss),or=find_(o,pay,2),credits=Number(o.getRange(or,6).getValue());g6LedgerPost_(ss,tr,credits,'CREDIT','REFUND_CREDIT','Approved refund '+d.reference,pay,d.reference,d.key);s.getRange(r,7,1,3).setValues([['APPROVED',credits,new Date()]]);g6CreateCreditNote_(ss,d.reference)}else{s.getRange(r,7).setValue('REJECTED');s.getRange(r,9).setValue(new Date())}audit_(ss,'REFUND_'+d.status,d.reference,s.getRange(r,3).getDisplayValue())}
function g6Folder_(){const p=PropertiesService.getScriptProperties(),id=p.getProperty('HAULMATCH_FINANCE_FOLDER_ID');if(id){try{return DriveApp.getFolderById(id)}catch(e){}}const f=DriveApp.createFolder('HaulMatch 360 Finance Documents');p.setProperty('HAULMATCH_FINANCE_FOLDER_ID',f.getId());return f}
function g6Pdf_(title,ref,lines){const doc=DocumentApp.create(title+' '+ref),b=doc.getBody();b.appendParagraph('HaulMatch 360').setHeading(DocumentApp.ParagraphHeading.TITLE);b.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);b.appendParagraph('Reference: '+ref);b.appendParagraph('Generated: '+new Date().toISOString());b.appendHorizontalRule();lines.forEach(x=>b.appendParagraph(x));b.appendHorizontalRule();b.appendParagraph('SANDBOX / TEST DOCUMENT - NOT A TAX INVOICE UNLESS FORMALLY APPROVED');doc.saveAndClose();const file=DriveApp.getFileById(doc.getId()),pdf=g6Folder_().createFile(file.getAs(MimeType.PDF).setName(title.replace(/ /g,'_')+'_'+ref+'.pdf'));file.setTrashed(true);return pdf.getUrl()}
function g6DocRow_(ss,tr,type,description,amount,payment,refund,url){const ref='HMDOC-'+Utilities.getUuid().slice(0,10).toUpperCase();g6Docs_(ss).appendRow([new Date(),ref,tr,type,description,amount,payment||'',refund||'',url,'GENERATED']);return ref}
function g6CreatePaymentDocs_(ss,pay){const o=g6Orders_(ss),r=find_(o,pay,2);if(!r)return;const tr=o.getRange(r,3).getDisplayValue(),pack=o.getRange(r,5).getDisplayValue(),credits=o.getRange(r,6).getDisplayValue(),amount=Number(o.getRange(r,7).getValue());const inv='INV-'+Utilities.getUuid().slice(0,8).toUpperCase(),iu=g6Pdf_('Credit Purchase Invoice',inv,['Transporter reference: '+tr,'Pack: '+pack,'Credits: '+credits,'Amount: R '+amount.toFixed(2),'Payment reference: '+pay]);g6DocRow_(ss,tr,'INVOICE','Credit purchase '+pack,amount,pay,'',iu);const rec='RCT-'+Utilities.getUuid().slice(0,8).toUpperCase(),ru=g6Pdf_('Payment Receipt',rec,['Transporter reference: '+tr,'Credits issued: '+credits,'Amount received: R '+amount.toFixed(2),'Payment reference: '+pay,'Payment status: COMPLETE (sandbox simulation)']);g6DocRow_(ss,tr,'RECEIPT','Payment receipt '+pack,amount,pay,'',ru)}
function g6CreateCreditNote_(ss,refund){const r=g6Refunds_(ss),rr=find_(r,refund,2);if(!rr)return;const tr=r.getRange(rr,4).getDisplayValue(),pay=r.getRange(rr,3).getDisplayValue(),credits=r.getRange(rr,8).getDisplayValue(),ref='CN-'+Utilities.getUuid().slice(0,8).toUpperCase(),url=g6Pdf_('Credit Note',ref,['Transporter reference: '+tr,'Refund request: '+refund,'Original payment: '+pay,'Credits returned: '+credits]);g6DocRow_(ss,tr,'CREDIT NOTE','Approved refund '+refund,0,pay,refund,url)}
function g6Statement_(ss,d){const t=gTransporter_(ss,d.transporterReference,d.email);if(!t)throw Error('Approved transporter reference and email do not match');const l=g6Ledger_(ss),rows=l.getLastRow()>1?l.getRange(2,1,l.getLastRow()-1,l.getLastColumn()).getDisplayValues().filter(x=>x[2]===d.transporterReference):[],ref='STM-'+Utilities.getUuid().slice(0,8).toUpperCase(),lines=['Transporter: '+t.company,'Transporter reference: '+d.transporterReference,'Ledger entries: '+rows.length].concat(rows.map(x=>x[0]+' | '+x[7]+' | '+x[3]+' '+x[4]+' | Balance '+x[6]+' | '+x[8])),url=g6Pdf_('Wallet Statement',ref,lines);g6DocRow_(ss,d.transporterReference,'STATEMENT','Wallet statement',0,'','',url)}
function g6GenerateDocuments_(ss,d){checkAdmin_(d.key);g6CreatePaymentDocs_(ss,d.paymentReference)}
function g6Documents_(ref,email){const ss=SpreadsheetApp.openById(SHEET_ID),t=gTransporter_(ss,ref,email);if(!t)return {ok:false,error:'Approved transporter reference and email do not match'};const s=g6Docs_(ss),v=s.getDataRange().getDisplayValues();return {ok:true,items:v.slice(1).filter(x=>x[2]===ref).reverse().map(x=>({reference:x[1],type:x[3],description:x[4],amount:Number(x[5]||0),url:x[8],status:x[9]}))}}
function g6Admin_(key){checkAdmin_(key);const ss=SpreadsheetApp.openById(SHEET_ID),o=g6Orders_(ss),ov=o.getDataRange().getDisplayValues(),t=sheet_(ss,'Transporter Applications',TH),r=g6Refunds_(ss),rv=r.getDataRange().getDisplayValues(),refunds=rv.slice(1).map(x=>({reference:x[1],paymentReference:x[2],transporterReference:x[3],reason:x[5],status:x[6]}));return {ok:true,totalPaid:ov.slice(1).filter(x=>x[7]==='COMPLETE').reduce((a,x)=>a+Number(x[6]||0),0),pending:ov.slice(1).filter(x=>x[7]==='PENDING').length,creditsIssued:ov.slice(1).filter(x=>x[8]==='YES').reduce((a,x)=>a+Number(x[5]||0),0),refundsOpen:refunds.filter(x=>x.status==='OPEN').length,orders:ov.slice(1).reverse().map(x=>{const tr=find_(t,x[2],2);return {reference:x[1],company:tr?t.getRange(tr,4).getDisplayValue():x[2],pack:x[4],credits:Number(x[5]),amount:Number(x[6]),status:x[7]}}),refunds:refunds}}
function g6Reconcile_(key){checkAdmin_(key);const ss=SpreadsheetApp.openById(SHEET_ID),w=gWallets_(ss),wv=w.getDataRange().getDisplayValues(),l=g6Ledger_(ss),lv=l.getDataRange().getDisplayValues(),opening=wv.slice(1).reduce((a,x)=>a+Number(x[3]||0),0),issued=lv.slice(1).filter(x=>x[7]==='PURCHASE_CREDIT').reduce((a,x)=>a+Number(x[4]||0),0),debits=lv.slice(1).filter(x=>x[3]==='DEBIT').reduce((a,x)=>a+Number(x[4]||0),0),adjustments=lv.slice(1).filter(x=>x[3]==='CREDIT'&&x[7]!=='PURCHASE_CREDIT').reduce((a,x)=>a+Number(x[4]||0),0),actual=wv.slice(1).reduce((a,x)=>a+Number(x[2]||0),0),expected=opening+issued-debits+adjustments,balanced=expected===actual;g6Recon_(ss).appendRow([new Date(),opening,issued,debits,adjustments,expected,actual,balanced,key]);return {ok:true,opening:opening,issued:issued,debits:debits,adjustments:adjustments,expected:expected,actual:actual,balanced:balanced}}
function upgradeG1ToG6Sheets(){upgradeG1ToG5Sheets();const ss=SpreadsheetApp.openById(SHEET_ID);g6EnsurePacks_(ss);g6Orders_(ss);g6Ledger_(ss);g6Docs_(ss);g6Refunds_(ss);g6Recon_(ss);}


// G7 DIRECT MOBILE PHOTO AND DOCUMENT UPLOAD
function g7UploadFolder_(){const p=PropertiesService.getScriptProperties(),id=p.getProperty('HAULMATCH_UPLOAD_FOLDER_ID');if(id){try{return DriveApp.getFolderById(id)}catch(e){}}const f=DriveApp.createFolder('HaulMatch 360 Private Uploads');p.setProperty('HAULMATCH_UPLOAD_FOLDER_ID',f.getId());return f}
function g7SafeName_(name){return String(name||'upload').replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,150)}
function g7SaveUploads_(ss,uploads,requestRef,existingLink){if(!uploads||!uploads.length)return existingLink||'';if(uploads.length>9)throw Error('Maximum 8 photos and 1 PDF allowed');const folder=g7UploadFolder_(),index=sheet_(ss,'Request Uploads',['Timestamp','Upload Reference','Request Reference','Kind','Position','Original Name','MIME Type','Bytes','Drive File ID','Drive URL','Status']);const urls=[];uploads.forEach((u,i)=>{const mime=String(u.mimeType||''),kind=String(u.kind||'');if(kind==='LOAD_PHOTO'&&!['image/jpeg','image/png','image/webp'].includes(mime))throw Error('Unsupported image type');if(kind==='PRIVATE_DOCUMENT'&&mime!=='application/pdf')throw Error('Unsupported document type');const bytes=Utilities.base64Decode(String(u.data||''));if(bytes.length>5*1024*1024)throw Error('A selected file exceeds 5 MB');const uploadRef='HMUP-'+Utilities.getUuid().slice(0,10).toUpperCase(),blob=Utilities.newBlob(bytes,mime,requestRef+'_'+uploadRef+'_'+g7SafeName_(u.name)),file=folder.createFile(blob);file.setDescription('HaulMatch '+kind+' for '+requestRef);index.appendRow([new Date(),uploadRef,requestRef,kind,Number(u.position||i+1),g7SafeName_(u.name),mime,bytes.length,file.getId(),file.getUrl(),'STORED']);if(kind==='LOAD_PHOTO')urls.push(file.getUrl())});audit_(ss,'REQUEST_UPLOADS_STORED',requestRef,String(uploads.length));return [existingLink||'',...urls].filter(Boolean).join(', ')}
function g7PostMessage_(ok, reference, error) {
  const data = JSON.stringify({
    source: 'HAULMATCH_UPLOAD',
    ok: ok,
    reference: reference || '',
    error: error || ''
  }).replace(/</g, '\\u003c');

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<html><head><meta charset="utf-8"></head><body>' +
      '<script>' +
      'window.parent.postMessage(' + data + ', "*");' +
      '<\/script>' +
      '</body></html>'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function upgradeG7Sheets(){upgradeG1ToG6Sheets();const ss=SpreadsheetApp.openById(SHEET_ID);sheet_(ss,'Request Uploads',['Timestamp','Upload Reference','Request Reference','Kind','Position','Original Name','MIME Type','Bytes','Drive File ID','Drive URL','Status']);g7UploadFolder_()}

function setupG7Only() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  sheet_(ss, 'Request Uploads', [
    'Timestamp',
    'Upload Reference',
    'Request Reference',
    'Kind',
    'Position',
    'Original Name',
    'MIME Type',
    'Bytes',
    'Drive File ID',
    'Drive URL',
    'Status'
  ]);

  const folder = g7UploadFolder_();

  console.log('Request Uploads ready');
  console.log('Upload folder ID: ' + folder.getId());
}


// ADMIN IFRAME RESPONSE - avoids Google JSONP/account-routing failures.
function adminPostMessage_(payload) {
  const message = {
    source: 'HAULMATCH_ADMIN',
    payload: payload || {
      ok: false,
      error: 'Empty Admin response'
    }
  };

  // Escape HTML-sensitive characters before embedding JSON in a script block.
  const safePayload = JSON.stringify(message)
    .replace(/</g, '\u003c')
    .replace(/>/g, '\u003e')
    .replace(/&/g, '\u0026');

  // Split the closing script tag so the server-side source cannot produce
  // an escaped <\/script> tag that the iframe browser fails to execute.
  const html =
    '<!doctype html>' +
    '<html><head><meta charset="utf-8"></head><body>' +
    '<script>' +
    'window.parent.postMessage(' + safePayload + ', "*");' +
    '</scr' + 'ipt>' +
    '</body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


// SECURE SAME-ORIGIN APPS SCRIPT ADMIN CONSOLE
function adminConsole_() {
  return adminConsoleRender_({ key: '', message: '', error: '', data: null });
}

function adminConsolePost_(parameters) {
  const key = String(parameters.adminKey || '');
  const action = String(parameters.consoleAction || 'LOAD');
  const reference = String(parameters.reference || '');
  const cost = Number(parameters.cost || 0);

  try {
    checkAdmin_(key);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let message = 'Operations loaded.';

    if (action === 'PUBLISHED' || action === 'CLOSED') {
      adminAction_(ss, {
        key: key,
        reference: reference,
        status: action
      });
      message = reference + ' updated to ' + action + '.';
    } else if (action === 'COST') {
      gSetCost_(ss, {
        key: key,
        reference: reference,
        cost: cost
      });
      message = reference + ' lead cost updated to ' + cost + ' credits.';
    } else if (action !== 'LOAD') {
      throw new Error('Unsupported Admin action');
    }

    return adminConsoleRender_({
      key: key,
      message: message,
      error: '',
      data: gAdmin_(key)
    });
  } catch (error) {
    return adminConsoleRender_({
      key: key,
      message: '',
      error: error && error.message ? error.message : String(error),
      data: null
    });
  }
}

function adminConsoleRender_(model) {
  const webAppUrl = ScriptApp.getService().getUrl();
  const key = String(model.key || '');
  const data = model.data;
  const message = String(model.message || '');
  const error = String(model.error || '');
  const escape = adminHtmlEscape_;

  let content = '';

  if (data && data.ok) {
    const metrics = [
      ['Published', data.published],
      ['Unlocks', data.unlocks],
      ['Quotes', data.quotes],
      ['Appointments', data.appointments],
      ['Open issues', data.issues]
    ];

    const metricHtml = metrics.map(function(item) {
      return '<div class="kpi"><strong>' + escape(item[1]) + '</strong>' + escape(item[0]) + '</div>';
    }).join('');

    const requests = data.requests || [];
    const requestHtml = requests.length ? requests.map(function(row) {
      const ref = escape(row.reference);
      return '<article class="row">' +
        '<div><b>' + ref + ' Â· ' + escape(row.transportType) + '</b>' +
        '<p>' + escape(row.collection) + ' â†’ ' + escape(row.delivery) + '</p>' +
        '<span class="status">' + escape(row.status) + ' Â· ' + escape(row.cost) + ' credits Â· ' + escape(row.responses) + '/6 responses</span></div>' +
        '<div class="actions">' +
          adminActionForm_(key, ref, 'PUBLISHED', 'Publish', 'primary') +
          adminCostForm_(key, ref, row.cost) +
          adminActionForm_(key, ref, 'CLOSED', 'Close', 'danger') +
        '</div>' +
      '</article>';
    }).join('') : '<div class="box">No open requests.</div>';

    content = '<div class="kpis">' + metricHtml + '</div><h2>Lead control</h2>' + requestHtml;
  }

  const html = '<!doctype html>' +
  '<html><head><base target="_top"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>HaulMatch 360 Admin</title><style>' +
  ':root{--navy:#071827;--panel:#102f49;--cyan:#22d3ee;--lime:#b7f52f;--text:#edf6ff;--muted:#a8bfd0}' +
  '*{box-sizing:border-box}body{margin:0;background:var(--navy);color:var(--text);font:15px Arial,sans-serif}.top{background:#ffc857;color:#172000;text-align:center;padding:11px;font-weight:900}.wrap{max-width:1180px;margin:auto;padding:38px 5%}h1{font-size:clamp(38px,7vw,70px);margin:8px 0 30px}.eyebrow{color:var(--cyan);font-weight:900;letter-spacing:2px}.box,.row,.kpi{background:var(--panel);border:1px solid #ffffff18;border-radius:16px;padding:18px}.login{display:grid;grid-template-columns:1fr auto;gap:12px;margin-bottom:18px}input{width:100%;padding:14px;border-radius:10px;border:1px solid #436078;background:#071d2e;color:#fff}button{border:0;border-radius:11px;padding:13px 17px;font-weight:900;cursor:pointer}.primary{background:var(--lime);color:#172000}.secondary{background:#19486c;color:#fff}.danger{background:#6b2530;color:#fff}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0}.kpi strong{display:block;font-size:29px}.row{display:grid;grid-template-columns:1fr auto;gap:18px;margin:12px 0}.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.actions form{margin:0}.cost-form{display:flex;gap:6px}.cost-form input{width:72px;padding:10px}.status{color:var(--muted)}.error{color:#ffadb4;margin:12px 0}.success{color:#bff5cc;margin:12px 0}@media(max-width:800px){.login,.row{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}}' +
  '</style></head><body><div class="top">SECURE HAULMATCH ADMIN CONSOLE</div><main class="wrap">' +
  '<div class="eyebrow">G7 OPERATIONS</div><h1>Admin Cockpit</h1>' +
  '<form class="box login" method="post" action="' + escape(webAppUrl) + '"><input type="hidden" name="formType" value="adminConsoleForm"><input type="hidden" name="consoleAction" value="LOAD">' +
  '<input name="adminKey" type="password" placeholder="Admin key" value="' + escape(key) + '" autocomplete="current-password" required>' +
  '<button class="primary" type="submit">Load Operations</button></form>' +
  (message ? '<div class="success">' + escape(message) + '</div>' : '') +
  (error ? '<div class="error">' + escape(error) + '</div>' : '') +
  content + '</main></body></html>';

  return HtmlService.createHtmlOutput(html).setTitle('HaulMatch 360 Admin');
}

function adminActionForm_(key, reference, action, label, cssClass) {
  const webAppUrl = ScriptApp.getService().getUrl();
  return '<form method="post" action="' + adminHtmlEscape_(webAppUrl) + '">' +
    '<input type="hidden" name="formType" value="adminConsoleForm">' +
    '<input type="hidden" name="adminKey" value="' + adminHtmlEscape_(key) + '">' +
    '<input type="hidden" name="reference" value="' + adminHtmlEscape_(reference) + '">' +
    '<input type="hidden" name="consoleAction" value="' + adminHtmlEscape_(action) + '">' +
    '<button class="' + adminHtmlEscape_(cssClass) + '" type="submit">' + adminHtmlEscape_(label) + '</button>' +
  '</form>';
}

function adminCostForm_(key, reference, currentCost) {
  const webAppUrl = ScriptApp.getService().getUrl();
  return '<form class="cost-form" method="post" action="' + adminHtmlEscape_(webAppUrl) + '">' +
    '<input type="hidden" name="formType" value="adminConsoleForm">' +
    '<input type="hidden" name="adminKey" value="' + adminHtmlEscape_(key) + '">' +
    '<input type="hidden" name="reference" value="' + adminHtmlEscape_(reference) + '">' +
    '<input type="hidden" name="consoleAction" value="COST">' +
    '<input name="cost" type="number" min="1" max="5" value="' + adminHtmlEscape_(currentCost || 2) + '" required>' +
    '<button class="secondary" type="submit">Set Cost</button>' +
  '</form>';
}

function adminHtmlEscape_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// GENERIC PUBLIC IFRAME API
// Replaces JSONP for the GitHub Pages frontend and avoids Google account routing.
function apiQueryPostMessage_(parameters) {
  const requestId = String(parameters.requestId || '');
  const action = String(parameters.apiAction || '');
  let result;

  try {
    if (action === 'gLeads') {
      result = { ok: true, items: gLeads_() };
    } else if (action === 'gWallet') {
      result = gWallet_(parameters.transporterReference, parameters.email);
    } else if (action === 'gUnlock') {
      result = gUnlock_(parameters.reference, parameters.transporterReference, parameters.email);
    } else if (action === 'gPro') {
      result = gPro_(parameters.transporterReference, parameters.email);
    } else if (action === 'gCustomerQuotes') {
      result = gCustomerQuotes_(parameters.reference, parameters.email);
    } else if (action === 'gAppointments') {
      result = gAppointments_(parameters.reference, parameters.email);
    } else if (action === 'g6Packs') {
      result = { ok: true, items: g6Packs_() };
    } else if (action === 'g6Wallet') {
      result = g6Wallet_(parameters.transporterReference, parameters.email);
    } else if (action === 'g6Documents') {
      result = g6Documents_(parameters.transporterReference, parameters.email);
    } else {
      result = { ok: false, error: 'Unsupported API action: ' + action };
    }
  } catch (error) {
    result = {
      ok: false,
      error: error && error.message ? error.message : String(error)
    };
  }

  return apiPostMessage_(requestId, result);
}

function apiPostMessage_(requestId, payload) {
  const message = {
    source: 'HAULMATCH_API',
    requestId: String(requestId || ''),
    payload: payload || {
      ok: false,
      error: 'Empty API response'
    }
  };

  const safePayload = JSON.stringify(message)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const html =
    '<!doctype html>' +
    '<html>' +
    '<head><meta charset="utf-8"></head>' +
    '<body>' +
    '<script>' +
    'window.parent.postMessage(' + safePayload + ', "*");' +
    'if (window.top !== window.parent) {' +
    '  window.top.postMessage(' + safePayload + ', "*");' +
    '}' +
    '</scr' + 'ipt>' +
    '</body>' +
    '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}

/* HAULMATCH FINAL ADMIN V3 + GOOGLE AUTH START */
function adminConsoleRoutePost_(p){var supplied=String(p.adminKey||'');if(ADMIN_KEY&&supplied===ADMIN_KEY)return adminConsoleV3Post_(p);return adminGoogleActionPost_(p);}
function adminConsoleV2_(){return adminConsoleV3Render_({key:'',message:'',error:'',data:null,admin:null});}
function adminConsoleV2Post_(p){return adminConsoleV3Post_(p);}
function adminConsoleV3Post_(p){
  var key=String(p.adminKey||''),action=String(p.consoleAction||'LOAD'),ref=String(p.reference||''),credits=Number(p.credits||0),reason=String(p.reason||''),cost=Number(p.cost||0),email=String(p.email||'').trim().toLowerCase();
  try{
    checkAdmin_(key);var ss=SpreadsheetApp.openById(SHEET_ID),message='Admin data refreshed.';
    if(['REQUEST_PUBLISH','REQUEST_CLOSE','REQUEST_REOPEN','REQUEST_UNPUBLISH'].indexOf(action)>=0){var map={REQUEST_PUBLISH:'PUBLISHED',REQUEST_CLOSE:'CLOSED',REQUEST_REOPEN:'NEW',REQUEST_UNPUBLISH:'NEW'};adminAction_(ss,{key:key,reference:ref,status:map[action]});message=ref+' updated to '+map[action]+'.';}
    else if(action==='REQUEST_COST'){gSetCost_(ss,{key:key,reference:ref,cost:cost});message=ref+' lead cost set to '+cost+' credits.';}
    else if(['TRANSPORTER_APPROVE','TRANSPORTER_MORE_INFO','TRANSPORTER_REJECT','TRANSPORTER_BLOCK'].indexOf(action)>=0){var sm={TRANSPORTER_APPROVE:'APPROVED',TRANSPORTER_MORE_INFO:'MORE INFO REQUIRED',TRANSPORTER_REJECT:'REJECTED',TRANSPORTER_BLOCK:'BLOCKED'};if(action==='TRANSPORTER_BLOCK')moderationAction_(ss,{key:key,reference:ref,status:'BLOCKED'});else transporterDecision_(ss,{key:key,reference:ref,status:sm[action]});message=ref+' updated to '+sm[action]+'.';}
    else if(action==='CREDIT_ADJUST'||action==='UNLOCK_REVERSAL'){if(!reason||!credits)throw Error('A non-zero credit amount and reason are required.');if(action==='UNLOCK_REVERSAL'&&credits<0)credits=Math.abs(credits);g6WalletAdjust_(ss,{key:key,transporterReference:ref,credits:credits,reason:(action==='UNLOCK_REVERSAL'?'TECHNICAL UNLOCK REVERSAL: ':'CREDIT ADJUSTMENT: ')+reason});message=ref+' adjusted by '+credits+' credits.';}
    else if(action==='PAYMENT_COMPLETE'||action==='PAYMENT_FAILED'){g6PaymentDecision_(ss,{key:key,reference:ref,status:action==='PAYMENT_COMPLETE'?'COMPLETE':'FAILED'});message=ref+' payment updated.';}
    else if(action==='ADD_ADMIN'){adminV3AddEmail_(email);audit_(ss,'ADMIN_USER_ADDED',email,'Google admin allow-list');message=email+' added as an authorized admin.';}
    else if(action==='REMOVE_ADMIN'){adminV3RemoveEmail_(email);audit_(ss,'ADMIN_USER_REMOVED',email,'Google admin allow-list');message=email+' removed from the authorized admin list.';}
    else if(action==='EXPORT_TAX'){var link=adminV3TaxExport_(ss,String(p.fromDate||''),String(p.toDate||''));message='Tax export created: '+link;}
    else if(action!=='LOAD')throw Error('Unsupported Admin action: '+action);
    return adminConsoleV3Render_({key:key,message:message,error:'',data:adminConsoleV3Data_(key),admin:null});
  }catch(e){return adminConsoleV3Render_({key:key,message:'',error:e.message||String(e),data:null,admin:null});}
}
function adminV3Emails_(){return adminGoogleAllowedEmails_();}
function adminV3AddEmail_(email){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid Google email address.');var p=PropertiesService.getScriptProperties(),a=adminV3Emails_();if(a.indexOf(email)<0)a.push(email);p.setProperty('HAULMATCH_ADMIN_EMAILS',a.join(','));}
function adminV3RemoveEmail_(email){var p=PropertiesService.getScriptProperties(),a=adminV3Emails_().filter(function(x){return x!==email;});if(!a.length)throw Error('At least one administrator must remain.');p.setProperty('HAULMATCH_ADMIN_EMAILS',a.join(','));}
function adminConsoleV3Data_(key){
  checkAdmin_(key);var ss=SpreadsheetApp.openById(SHEET_ID),r=sheet_(ss,'Transport Requests',RH),t=sheet_(ss,'Transporter Applications',TH),w=gWallets_(ss),u=gUnlocks_(ss),q=sheet_(ss,'Quotes',QH),o=g6Orders_(ss),l=g6Ledger_(ss),docs=g6Docs_(ss),audit=sheet_(ss,'Audit Log',['Timestamp','Event','Reference','Detail']);
  var rv=r.getDataRange().getDisplayValues(),tv=t.getDataRange().getDisplayValues(),wv=w.getDataRange().getDisplayValues(),uv=u.getDataRange().getDisplayValues(),ov=o.getDataRange().getDisplayValues(),lv=l.getDataRange().getDisplayValues(),dv=docs.getDataRange().getDisplayValues(),av=audit.getDataRange().getDisplayValues();
  var requests=rv.slice(1).reverse().slice(0,100).map(function(x){var m=gSetting_(ss,x[1]);return{reference:x[1],type:x[6],route:x[11]+' to '+x[12],status:x[19],risk:x[22]||0,cost:m.cost,responses:m.count};});
  var transporters=tv.slice(1).reverse().slice(0,100).map(function(x){var wr=find_(w,x[1],1),bal=wr?Number(w.getRange(wr,3).getValue()||0):0;return{reference:x[1],contact:x[2],company:x[3],email:x[4],services:x[7],status:x[16],risk:x[17]||0,credits:bal};});
  var orders=ov.slice(1).reverse().slice(0,100).map(function(x){return{date:x[0],reference:x[1],transporter:x[2],email:x[3],pack:x[4],credits:Number(x[5]||0),amount:Number(x[6]||0),status:x[7],credited:x[8]};});
  var ledger=lv.slice(1).reverse().slice(0,150).map(function(x){return{date:x[0],reference:x[1],transporter:x[2],direction:x[3],credits:x[4],before:x[5],after:x[6],type:x[7],reason:x[8],payment:x[9]};});
  var unlocks=uv.slice(1).reverse().slice(0,150).map(function(x){return{date:x[0],reference:x[1],request:x[2],transporter:x[3],email:x[4],credits:x[5],balance:x[6],status:x[7]};});
  var totalPaid=orders.filter(function(x){return x.status==='COMPLETE'}).reduce(function(n,x){return n+x.amount;},0);
  return{published:requests.filter(function(x){return x.status==='PUBLISHED'}).length,pendingRequests:requests.filter(function(x){return x.status==='NEW'}).length,pendingTransporters:transporters.filter(function(x){return x.status==='PENDING REVIEW'}).length,totalCredits:wv.slice(1).reduce(function(n,x){return n+Number(x[2]||0)},0),totalPaid:totalPaid,pendingPayments:orders.filter(function(x){return x.status==='PENDING'}).length,requests:requests,transporters:transporters,orders:orders,ledger:ledger,unlocks:unlocks,documents:dv.slice(1).reverse().slice(0,100),audit:av.slice(1).reverse().slice(0,150),admins:adminV3Emails_()};
}
function adminV3TaxExport_(ss,fromDate,toDate){var o=g6Orders_(ss),l=g6Ledger_(ss),d=g6Docs_(ss),folder=g6Folder_(),stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Africa/Johannesburg','yyyyMMdd_HHmmss');function csv(sheet){var v=sheet.getDataRange().getDisplayValues();return v.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');}var files=[['Credit_Sales_'+stamp+'.csv',csv(o)],['Wallet_Ledger_'+stamp+'.csv',csv(l)],['Document_Register_'+stamp+'.csv',csv(d)]];var urls=[];files.forEach(function(x){var f=folder.createFile(x[0],x[1],MimeType.CSV);urls.push(f.getUrl());});audit_(ss,'TAX_EXPORT_CREATED',fromDate+' to '+toDate,urls.join(' | '));return urls.join(' | ');}
function adminV3Form_(url,key,action,ref,label,cls,extra){return '<form method="post" action="'+adminHtmlEscape_(url)+'"><input type="hidden" name="formType" value="adminConsoleForm"><input type="hidden" name="adminKey" value="'+adminHtmlEscape_(key)+'"><input type="hidden" name="consoleAction" value="'+adminHtmlEscape_(action)+'"><input type="hidden" name="reference" value="'+adminHtmlEscape_(ref||'')+'">'+(extra||'')+'<button class="'+cls+'" type="submit">'+adminHtmlEscape_(label)+'</button></form>';}
function adminConsoleV3Render_(m){
  var e=adminHtmlEscape_,url=ScriptApp.getService().getUrl(),key=String(m.key||''),d=m.data,post=function(a,r,l,c,x){return adminV3Form_(url,key,a,r,l,c,x);},money=function(n){return 'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2});};var content='';
  if(d){
    var req=d.requests.map(function(x){var b=x.status==='PUBLISHED'?post('REQUEST_UNPUBLISH',x.reference,'Unpublish','ghost')+post('REQUEST_CLOSE',x.reference,'Close','danger'):x.status==='CLOSED'?post('REQUEST_REOPEN',x.reference,'Reopen','blue'):post('REQUEST_PUBLISH',x.reference,'Publish','primary')+post('REQUEST_CLOSE',x.reference,'Close','danger');return '<article class="row"><div><b>'+e(x.reference)+' | '+e(x.type)+'</b><p>'+e(x.route)+'</p><span>'+e(x.status)+' | Risk '+e(x.risk)+' | '+e(x.cost)+' credits | '+e(x.responses)+'/6</span></div><div class="acts">'+b+post('REQUEST_COST',x.reference,'Set Cost','blue','<input class="smallinput" name="cost" type="number" min="1" max="5" value="'+e(x.cost)+'">')+'</div></article>';}).join('')||'<div class="empty">No requests.</div>';
    var trs=d.transporters.map(function(x){var b=x.status==='APPROVED'?post('TRANSPORTER_BLOCK',x.reference,'Block','danger'):post('TRANSPORTER_APPROVE',x.reference,'Approve + Wallet','primary')+post('TRANSPORTER_MORE_INFO',x.reference,'More Info','ghost')+post('TRANSPORTER_REJECT',x.reference,'Reject','danger');return '<article class="row"><div><b>'+e(x.reference)+' | '+e(x.company||x.contact)+'</b><p>'+e(x.email)+' | '+e(x.services)+'</p><span>'+e(x.status)+' | '+e(x.credits)+' credits | Risk '+e(x.risk)+'</span></div><div class="acts">'+b+post('CREDIT_ADJUST',x.reference,'Adjust Credits','blue','<input class="smallinput" name="credits" type="number" placeholder="+/-"><input class="reason" name="reason" placeholder="Reason" required>')+'</div></article>';}).join('')||'<div class="empty">No transporters.</div>';
    var payments=d.orders.map(function(x){var b=x.status==='PENDING'?post('PAYMENT_COMPLETE',x.reference,'Mark Complete','primary')+post('PAYMENT_FAILED',x.reference,'Mark Failed','danger'):'';return '<tr><td>'+e(x.date)+'</td><td>'+e(x.reference)+'</td><td>'+e(x.transporter)+'</td><td>'+e(x.pack)+'</td><td>'+e(x.credits)+'</td><td>'+money(x.amount)+'</td><td>'+e(x.status)+'</td><td>'+b+'</td></tr>';}).join('')||'<tr><td colspan="8">No credit payments yet.</td></tr>';
    var unlocks=d.unlocks.map(function(x){return '<tr><td>'+e(x.date)+'</td><td>'+e(x.request)+'</td><td>'+e(x.transporter)+'</td><td>'+e(x.credits)+'</td><td>'+e(x.balance)+'</td><td>'+e(x.status)+'</td></tr>';}).join('')||'<tr><td colspan="6">No unlocks yet.</td></tr>';
    var ledger=d.ledger.map(function(x){return '<tr><td>'+e(x.date)+'</td><td>'+e(x.transporter)+'</td><td>'+e(x.type)+'</td><td>'+e(x.direction)+'</td><td>'+e(x.credits)+'</td><td>'+e(x.after)+'</td><td>'+e(x.reason)+'</td></tr>';}).join('')||'<tr><td colspan="7">No ledger entries.</td></tr>';
    var audits=d.audit.map(function(x){return '<tr><td>'+e(x[0])+'</td><td>'+e(x[1])+'</td><td>'+e(x[2])+'</td><td>'+e(x[3])+'</td></tr>';}).join('')||'<tr><td colspan="4">No audit entries.</td></tr>';
    var admins=d.admins.map(function(x){return '<article class="adminuser"><b>'+e(x)+'</b>'+post('REMOVE_ADMIN','', 'Remove','danger','<input type="hidden" name="email" value="'+e(x)+'">')+'</article>';}).join('');
    content='<div class="kpis"><div><b>'+d.pendingRequests+'</b>Pending requests</div><div><b>'+d.published+'</b>Published</div><div><b>'+d.pendingTransporters+'</b>Pending transporters</div><div><b>'+d.totalCredits+'</b>Wallet credits</div><div><b>'+money(d.totalPaid)+'</b>Credit income</div><div><b>'+d.pendingPayments+'</b>Pending payments</div></div>'+
    '<nav><button onclick="showTab(\'overview\')">Overview</button><button onclick="showTab(\'requests\')">Requests</button><button onclick="showTab(\'transporters\')">Transporters</button><button onclick="showTab(\'finance\')">Credits & Payments</button><button onclick="showTab(\'unlocks\')">Lead Unlocks</button><button onclick="showTab(\'tax\')">Tax Export</button><button onclick="showTab(\'audit\')">Audit Log</button><button onclick="showTab(\'admins\')">Admin Users</button></nav>'+
    '<section id="overview" class="tab active"><h2>Business Overview</h2><div class="modules"><div>Google Admin <b>ONLINE</b></div><div>Credit Payments <b>'+money(d.totalPaid)+'</b></div><div>Wallet Ledger <b>'+d.ledger.length+' entries</b></div><div>Lead Unlocks <b>'+d.unlocks.length+'</b></div></div></section>'+
    '<section id="requests" class="tab"><h2>Requests</h2>'+req+'</section><section id="transporters" class="tab"><h2>Transporters & Wallets</h2>'+trs+'</section>'+
    '<section id="finance" class="tab"><h2>Credits & Payments</h2><p>Only HaulMatch credit sales and wallet movements are recorded here.</p><div class="tablewrap"><table><tr><th>Date</th><th>Payment</th><th>Transporter</th><th>Pack</th><th>Credits</th><th>Amount</th><th>Status</th><th>Action</th></tr>'+payments+'</table></div><h3>Wallet Ledger</h3><div class="tablewrap"><table><tr><th>Date</th><th>Transporter</th><th>Type</th><th>Direction</th><th>Credits</th><th>Balance</th><th>Reason</th></tr>'+ledger+'</table></div></section>'+
    '<section id="unlocks" class="tab"><h2>Lead Unlocks</h2><div class="tablewrap"><table><tr><th>Date</th><th>Request</th><th>Transporter</th><th>Credits</th><th>Balance</th><th>Status</th></tr>'+unlocks+'</table></div><h3>Technical Unlock Reversal</h3>'+post('UNLOCK_REVERSAL','', 'Post Reversal','primary','<input name="reference" placeholder="Transporter reference" required><input class="smallinput" name="credits" type="number" min="1" placeholder="Credits" required><input class="reason" name="reason" placeholder="Technical reason" required>')+'</section>'+
    '<section id="tax" class="tab"><h2>Tax Export</h2><p>Exports HaulMatch credit sales, wallet ledger and finance document register as CSV files.</p>'+post('EXPORT_TAX','', 'Create Tax Export','primary','<input name="fromDate" type="date"><input name="toDate" type="date">')+'</section>'+
    '<section id="audit" class="tab"><h2>Audit Log</h2><div class="tablewrap"><table><tr><th>Timestamp</th><th>Event</th><th>Reference</th><th>Detail</th></tr>'+audits+'</table></div></section>'+
    '<section id="admins" class="tab"><h2>Authorized Google Admins</h2>'+admins+'<h3>Add Admin</h3>'+post('ADD_ADMIN','', 'Add Admin','primary','<input name="email" type="email" placeholder="admin@example.com" required>')+'</section>';
  }
  var html='<!doctype html><html><head><base target="_top"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HaulMatch Admin</title><style>:root{--n:#071827;--p:#10334f;--l:#b7f52f;--w:#edf7ff;--m:#a8bfd0}*{box-sizing:border-box}body{margin:0;background:var(--n);color:var(--w);font:15px Arial}.top{background:#ffc857;color:#172000;text-align:center;padding:11px;font-weight:900}.wrap{max-width:1500px;margin:auto;padding:28px 4%}.head{display:flex;justify-content:space-between;gap:14px;align-items:center}.head a{color:#fff;text-decoration:none;font-weight:900;margin-left:14px}h1{font-size:52px;margin:8px 0}.login,.row,.kpis>div,.modules>div,.empty,.adminuser{background:var(--p);border:1px solid #ffffff18;border-radius:15px;padding:16px}.login{display:grid;grid-template-columns:1fr auto;gap:10px}input{background:#071d2e;color:#fff;border:1px solid #49677c;border-radius:9px;padding:11px}button{border:0;border-radius:9px;padding:11px 14px;font-weight:900;cursor:pointer}.primary{background:var(--l);color:#172000}.blue{background:#176fa9;color:#fff}.ghost{background:#25465f;color:#fff}.danger{background:#7b2838;color:#fff}.msg{color:#a8ffbe;margin:14px 0}.err{color:#ffadb6}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:17px 0}.kpis b{display:block;font-size:26px}nav{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.tab{display:none}.tab.active{display:block}.row{display:grid;grid-template-columns:1fr auto;gap:12px;margin:10px 0}.row p,.row span{color:var(--m)}.acts,.acts form,section form{display:flex;gap:6px;flex-wrap:wrap}.smallinput{width:80px}.reason{width:180px}.modules{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.modules b{display:block;color:var(--l);margin-top:7px}.tablewrap{overflow:auto}table{width:100%;border-collapse:collapse;background:#0d2b44}th,td{padding:10px;border-bottom:1px solid #ffffff16;text-align:left;white-space:nowrap}.adminuser{display:flex;justify-content:space-between;align-items:center;margin:8px 0}@media(max-width:900px){.kpis,.modules{grid-template-columns:repeat(2,1fr)}.row,.login{grid-template-columns:1fr}.head{display:block}.head nav{margin-top:12px}}</style><script>function showTab(id){document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active")});document.getElementById(id).classList.add("active")}</script></head><body><div class="top">SECURE HAULMATCH GOOGLE ADMIN COCKPIT</div><main class="wrap"><div class="head"><div><h1>Admin Cockpit</h1></div><div><a href="https://haulmatch.wykiesautomation.co.za/">Home</a><a href="https://haulmatch.wykiesautomation.co.za/admin/">Sign Out</a></div></div><form class="login" method="post" action="'+e(url)+'"><input type="hidden" name="formType" value="adminConsoleForm"><input type="hidden" name="consoleAction" value="LOAD"><input name="adminKey" type="password" value="'+e(key)+'" placeholder="Admin key" required><button class="primary">Refresh Admin</button></form>'+(m.message?'<div class="msg">'+e(m.message)+'</div>':'')+(m.error?'<div class="err">'+e(m.error)+'</div>':'')+content+'</main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('HaulMatch Google Admin').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function adminGoogleAllowedEmails_(){var p=PropertiesService.getScriptProperties(),raw=p.getProperty('HAULMATCH_ADMIN_EMAILS')||p.getProperty('HAULMATCH_ADMIN_EMAIL')||'';return raw.split(/[;,\s]+/).map(function(x){return String(x).trim().toLowerCase();}).filter(String);}
function adminGoogleVerifyIdToken_(credential){if(!credential)throw Error('Google credential missing');var p=PropertiesService.getScriptProperties(),clientId=String(p.getProperty('HAULMATCH_GOOGLE_CLIENT_ID')||'').trim();if(!clientId)throw Error('HAULMATCH_GOOGLE_CLIENT_ID is not configured');var response=UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential),{muteHttpExceptions:true});if(response.getResponseCode()!==200)throw Error('Google token verification failed: '+response.getContentText());var token=JSON.parse(response.getContentText());if(String(token.aud||'')!==clientId)throw Error('Google token audience is invalid');if(String(token.email_verified||'')!=='true')throw Error('Google email is not verified');var email=String(token.email||'').toLowerCase();if(adminGoogleAllowedEmails_().indexOf(email)<0)throw Error('This Google account is not an authorized HaulMatch administrator');return{email:email,name:String(token.name||email),subject:String(token.sub||'')};}
function adminGoogleCreateSession_(admin){var token=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('HMADMIN_'+token,JSON.stringify(admin),21600);return token;}
function adminGoogleSession_(token){var raw=CacheService.getScriptCache().get('HMADMIN_'+String(token||''));if(!raw)throw Error('Admin session expired. Sign in with Google again.');return JSON.parse(raw);}
function adminGoogleReplaceSecret_(output,sessionToken,admin){var html=output.getContent(),safeToken=adminHtmlEscape_(sessionToken),safeEmail=adminHtmlEscape_(admin.email);html=html.replace(/<input name="adminKey" type="password"[^>]*>/,'<input type="hidden" name="adminKey" value="'+safeToken+'">');html=html.replace('<h1>Admin Cockpit</h1>','<h1>Admin Cockpit</h1><p style="color:#22d3ee;font-weight:700">Signed in as '+safeEmail+'</p>');return HtmlService.createHtmlOutput(html).setTitle('HaulMatch Google Admin').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
function adminGoogleLoginPost_(p){try{var admin=adminGoogleVerifyIdToken_(String(p.credential||'')),sessionToken=adminGoogleCreateSession_(admin);audit_(SpreadsheetApp.openById(SHEET_ID),'ADMIN_GOOGLE_LOGIN',admin.email,admin.subject);return adminGoogleReplaceSecret_(adminConsoleV3Render_({key:ADMIN_KEY,message:'Google administrator verified.',error:'',data:adminConsoleV3Data_(ADMIN_KEY),admin:admin}),sessionToken,admin);}catch(e){return adminGoogleError_(e.message||String(e));}}
function adminGoogleActionPost_(p){try{var admin=adminGoogleSession_(p.adminKey),copy={};Object.keys(p).forEach(function(k){copy[k]=p[k];});copy.adminKey=ADMIN_KEY;audit_(SpreadsheetApp.openById(SHEET_ID),'ADMIN_GOOGLE_ACTION',String(p.reference||''),admin.email+' | '+String(p.consoleAction||'LOAD'));return adminGoogleReplaceSecret_(adminConsoleV3Post_(copy),p.adminKey,admin);}catch(e){return adminGoogleError_(e.message||String(e));}}
function adminGoogleError_(message){return HtmlService.createHtmlOutput('<!doctype html><html><body style="margin:0;background:#071827;color:#fff;font:16px Arial;display:grid;place-items:center;min-height:100vh"><div style="background:#10334f;padding:28px;border-radius:18px;text-align:center"><h1>Admin access denied</h1><p style="color:#ffadb6">'+adminHtmlEscape_(message)+'</p><a style="color:#b7f52f" href="https://haulmatch.wykiesautomation.co.za/admin/">Return to Google Admin Sign-In</a></div></body></html>').setTitle('HaulMatch Admin Access').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}
/* HAULMATCH FINAL ADMIN V3 + GOOGLE AUTH END */

