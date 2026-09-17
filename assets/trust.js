const HMTRUST={
 disposable:['mailinator.com','yopmail.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org','sharklasers.com','throwawaymail.com'],
 suspicious:/\b(crypto|bitcoin|gift card|deposit first|pay before|whatsapp only|urgent payment)\b/i,
 email(v){const x=String(v||'').trim().toLowerCase(),domain=(x.split('@')[1]||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))throw Error('Enter a valid email');if(this.disposable.includes(domain))throw Error('Temporary email addresses are not allowed');return x},
 content(v){if(this.suspicious.test(String(v||'')))return 'REVIEW REQUIRED';return 'NORMAL'},
 fingerprint(){const raw=[navigator.userAgent,navigator.language,screen.width,screen.height,new Date().getTimezoneOffset()].join('|');let h=0;for(let i=0;i<raw.length;i++)h=((h<<5)-h)+raw.charCodeAt(i)|0;return 'FP-'+Math.abs(h).toString(36).toUpperCase()},
 token(){return document.querySelector('[name="cf-turnstile-response"]')?.value||''}
};
function injectTurnstile(){if(!window.HAULMATCH_CONFIG?.turnstileSiteKey)return;const targets=document.querySelectorAll('form');targets.forEach(f=>{const d=document.createElement('div');d.className='cf-turnstile';d.dataset.sitekey=window.HAULMATCH_CONFIG.turnstileSiteKey;f.insertBefore(d,f.lastElementChild)});const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js';s.async=true;s.defer=true;document.head.appendChild(s)}
document.addEventListener('DOMContentLoaded',injectTurnstile);