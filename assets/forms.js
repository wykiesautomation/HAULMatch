
const cfg=window.HAULMATCH_CONFIG||{};
const $=id=>document.getElementById(id);
function ref(prefix){const d=new Date(),stamp=d.toISOString().slice(0,10).replaceAll('-','');const rand=Math.random().toString(36).slice(2,8).toUpperCase();return `${prefix}-${stamp}-${rand}`}
function configured(){return cfg.appsScriptUrl&&cfg.appsScriptUrl.startsWith('https://script.google.com/macros/s/')}
function postHidden(form,payload){
 const frameName='hmSubmitFrame';let frame=$('hmSubmitFrame');if(!frame){frame=document.createElement('iframe');frame.name=frameName;frame.id='hmSubmitFrame';frame.className='hidden';document.body.appendChild(frame)}
 const f=document.createElement('form');f.method='POST';f.action=cfg.appsScriptUrl;f.target=frameName;f.className='hidden';
 const field=document.createElement('input');field.name='payload';field.value=JSON.stringify(payload);f.appendChild(field);document.body.appendChild(f);f.submit();setTimeout(()=>f.remove(),1000)
}
function val(id,msg){const el=$(id);if(!el||!String(el.value).trim()){el?.focus();throw new Error(msg)}return String(el.value).trim()}
function email(id){const v=val(id,'Enter a valid email address');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw new Error('Enter a valid email address');return v.toLowerCase()}
function phone(id){let v=val(id,'Enter a South African mobile number').replace(/\D/g,'');if(v.startsWith('27')&&v.length===11)return '+'+v;if(v.startsWith('0')&&v.length===10)return '+27'+v.slice(1);throw new Error('Enter a valid 10-digit South African mobile number')}
function setupForm(kind){
 const form=$('leadForm'),error=$('formError'),success=$('successBox');if(!form)return;
 form.addEventListener('submit',e=>{e.preventDefault();error.textContent='';try{
   if($('website').value)throw new Error('Submission blocked');
   if(!configured())throw new Error('The form backend is not configured yet. Contact '+cfg.supportEmail+'.');
   const data=kind==='request'?requestData():transporterData();data.formType=kind;data.reference=ref(kind==='request'?'HMREQ':'HMTRN');data.submittedAt=new Date().toISOString();data.page=location.href;data.userAgent=navigator.userAgent;
   postHidden(form,data);form.reset();form.classList.add('hidden');success.classList.remove('hidden');$('referenceText').textContent=data.reference;window.scrollTo({top:0,behavior:'smooth'});
 }catch(ex){error.textContent=ex.message}})
}
function requestData(){
 const consent=$('consent').checked;if(!consent)throw new Error('Accept the privacy and contact consent to continue');
 return {fullName:val('fullName','Enter your full name'),email:email('email'),mobile:phone('mobile'),customerType:val('customerType','Select customer type'),transportType:val('transportType','Select transport type'),itemDescription:val('itemDescription','Describe the vehicle or implement'),makeModel:$('makeModel').value.trim(),condition:val('condition','Select the condition'),registration:$('registration').value.trim(),mass:$('mass').value.trim(),dimensions:$('dimensions').value.trim(),collectionTown:val('collectionTown','Enter collection town or area'),deliveryTown:val('deliveryTown','Enter delivery town or area'),requiredDate:val('requiredDate','Select required date'),loadingSupport:$('loadingSupport').value,photoLink:$('photoLink').value.trim(),notes:$('notes').value.trim(),consent:true}
}
function transporterData(){
 const consent=$('consent').checked;if(!consent)throw new Error('Accept the declaration to continue');
 const services=[...document.querySelectorAll('input[name="services"]:checked')].map(x=>x.value);if(!services.length)throw new Error('Select at least one transport service');
 return {fullName:val('fullName','Enter contact name'),company:val('company','Enter company or trading name'),email:email('email'),mobile:phone('mobile'),businessType:val('businessType','Select business type'),services:services.join(', '),serviceAreas:val('serviceAreas','Enter service areas'),vehicles:val('vehicles','Describe available vehicles'),payload:$('payload').value.trim(),lowbed:$('lowbed').value,insurance:$('insurance').value,registrationNumber:$('registrationNumber').value.trim(),experience:$('experience').value.trim(),notes:$('notes').value.trim(),consent:true}
}
document.addEventListener('DOMContentLoaded',()=>{const kind=document.body.dataset.form;if(kind)setupForm(kind)})
