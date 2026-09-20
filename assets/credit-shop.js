(() => {
  const config = window.HAULMATCH_CONFIG || {};
  const api = String(config.appsScriptUrl || config.APPS_SCRIPT_URL || '').trim().replace('/macros/u/0/s/','/macros/s/').replace('/macros/u/1/s/','/macros/s/');
  const packs = {
    STARTER: {code:'STARTER', name:'Starter', credits:10, price:299},
    GROWTH: {code:'GROWTH', name:'Growth', credits:25, price:649},
    FLEET: {code:'FLEET', name:'Fleet', credits:50, price:1099}
  };
  let selected = null;
  const form = document.getElementById('purchaseForm');
  const message = document.getElementById('purchaseMessage');
  const button = document.getElementById('checkoutButton');
  const selectedPack = document.getElementById('selectedPack');
  const ref = document.getElementById('transporterReference');
  const email = document.getElementById('email');

  document.querySelectorAll('[data-pack]').forEach(el => el.addEventListener('click', () => {
    selected = packs[el.dataset.pack];
    selectedPack.textContent = `${selected.name}: ${selected.credits} credits for R${selected.price.toLocaleString('en-ZA')}`;
    button.disabled = false;
    document.getElementById('purchasePanel').scrollIntoView({behavior:'smooth', block:'center'});
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!selected) return;
    if (!api) { message.textContent = 'Payment service is not configured.'; return; }
    const reference = `HMPAY-${Date.now().toString(36).toUpperCase()}`;
    const payload = {
      formType:'g6CreateOrder',
      reference,
      submittedAt:new Date().toISOString(),
      transporterReference:ref.value.trim().toUpperCase(),
      email:email.value.trim().toLowerCase(),
      packCode:selected.code
    };
    document.getElementById('payload').value = JSON.stringify(payload);
    form.action = api;
    button.disabled = true;
    button.textContent = 'Creating secure order...';
    message.textContent = `Creating ${selected.name} order ${reference}.`;
    form.submit();
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Continue to PayFast';
      message.textContent = `Order ${reference} was submitted. Complete payment through the configured PayFast checkout.`;
    }, 1800);
  });
})();
