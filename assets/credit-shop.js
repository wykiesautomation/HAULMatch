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
  const sandboxButton = document.getElementById('sandboxButton');
  const sandboxForm = document.getElementById('payfastSandboxForm');
  const selectedPack = document.getElementById('selectedPack');
  const ref = document.getElementById('transporterReference');
  const email = document.getElementById('email');

  document.querySelectorAll('[data-pack]').forEach(el => el.addEventListener('click', () => {
    selected = packs[el.dataset.pack];
    selectedPack.textContent = `${selected.name}: ${selected.credits} credits for R${selected.price.toLocaleString('en-ZA')}`;
    button.disabled = false;
    sandboxButton.disabled = false;
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
    button.textContent = 'Creating credit order...';
    message.textContent = `Creating ${selected.name} order ${reference}.`;
    form.submit();
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Create Credit Order';
      message.textContent = `Order ${reference} was submitted. Complete payment through the configured PayFast checkout.`;
    }, 1800);
  });

  sandboxButton.addEventListener('click', () => {
    if (!selected) return;
    const transporterReference = ref.value.trim().toUpperCase();
    const approvedEmail = email.value.trim().toLowerCase();
    if (!transporterReference || !approvedEmail) {
      message.textContent = 'Enter the approved transporter reference and email first.';
      return;
    }

    const paymentReference = `HMSBX-${Date.now().toString(36).toUpperCase()}`;
    const returnUrl = new URL('../credit-shop/?sandbox=returned', location.href).href;
    const cancelUrl = new URL('../credit-shop/?sandbox=cancelled', location.href).href;
    const fields = {
      merchant_id: '10000100',
      merchant_key: '46f0cd694581a',
      return_url: returnUrl,
      cancel_url: cancelUrl,
      name_first: transporterReference,
      email_address: approvedEmail,
      m_payment_id: paymentReference,
      amount: selected.price.toFixed(2),
      item_name: `HaulMatch ${selected.name} - ${selected.credits} credits`,
      item_description: `Sandbox test for ${transporterReference}`,
      custom_str1: transporterReference,
      custom_str2: selected.code,
      custom_int1: selected.credits
    };

    sandboxForm.innerHTML = '';
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      sandboxForm.appendChild(input);
    });

    message.className = 'purchase-message sandbox-status';
    message.textContent = `Opening PayFast Sandbox for ${selected.name}. No real money will be charged.`;
    sandboxButton.disabled = true;
    setTimeout(() => {
      sandboxButton.disabled = false;
      sandboxForm.submit();
    }, 350);
  });

  const sandboxResult = new URLSearchParams(location.search).get('sandbox');
  if (sandboxResult === 'returned') {
    message.className = 'purchase-message sandbox-status';
    message.textContent = 'PayFast Sandbox returned successfully. This test did not issue real credits.';
  } else if (sandboxResult === 'cancelled') {
    message.className = 'purchase-message sandbox-status';
    message.textContent = 'PayFast Sandbox payment was cancelled. No credits were issued.';
  }

})();
