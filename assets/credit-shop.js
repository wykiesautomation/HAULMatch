(() => {
  const $ = id => document.getElementById(id);
  let selectedPackId = null;
  let paymentMode = 'disabled';
  let token = localStorage.getItem('hmApiToken') || '';
  const config = window.HAULMATCH_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || '').trim().replace(/\/$/, '');

  async function api(path, options = {}) {
    const headers = {'Content-Type':'application/json', ...(options.headers || {})};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!apiBaseUrl) throw new Error('HaulMatch payment API is not configured.');
    const url = new URL(path, apiBaseUrl + '/').toString();
    const response = await fetch(url, {...options, headers, mode:'cors'});
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || body.error || 'Request failed');
    return body;
  }

  async function load() {
    const [status, packs] = await Promise.all([
      api('/api/payments/payfast/status'),
      api('/api/credit-packs')
    ]);
    paymentMode = status.mode;
    $('modeBadge').textContent = status.mode === 'live' ? 'LIVE PAYMENTS' : 'PAYFAST SANDBOX';
    $('modeBadge').className = status.mode === 'live' ? 'mode-badge live' : 'mode-badge sandbox';
    $('checkoutButton').textContent = status.mode === 'live' ? 'Pay securely with PayFast' : 'Test with PayFast Sandbox';
    document.querySelectorAll('[data-pack]').forEach(button => {
      const pack = packs.find(x => x.code === button.dataset.pack);
      if (!pack) { button.disabled = true; return; }
      button.dataset.packId = pack.id;
      button.addEventListener('click', () => {
        selectedPackId = pack.id;
        $('selectedPack').textContent = `${pack.name}: ${pack.credits} credits for R${(pack.price_cents/100).toLocaleString('en-ZA')}`;
        $('checkoutButton').disabled = !status.checkout_enabled;
        $('purchasePanel').scrollIntoView({behavior:'smooth', block:'center'});
      });
    });
  }

  $('loginButton').addEventListener('click', async () => {
    try {
      const data = await api('/api/accounts/login', {method:'POST', body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});
      token = data.token; localStorage.setItem('hmApiToken', token);
      $('purchaseMessage').textContent = 'Transporter signed in. Select a package and continue.';
    } catch (error) { $('purchaseMessage').textContent = error.message; }
  });

  $('purchaseForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!token) { $('purchaseMessage').textContent = 'Sign in first.'; return; }
    if (!selectedPackId) { $('purchaseMessage').textContent = 'Select a package first.'; return; }
    try {
      $('checkoutButton').disabled = true;
      $('purchaseMessage').textContent = 'Creating secure PayFast checkout...';
      const checkout = await api('/api/payments/payfast/checkout', {method:'POST', body:JSON.stringify({pack_id:selectedPackId})});
      if (!checkout.configured) throw new Error('PayFast server credentials are not configured.');
      const form = $('payfastForm'); form.action = checkout.checkout_url; form.innerHTML = '';
      Object.entries(checkout.fields).forEach(([name,value]) => { const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input); });
      form.submit();
    } catch (error) {
      $('purchaseMessage').textContent = error.message;
      $('checkoutButton').disabled = false;
    }
  });

  load().catch(error => $('purchaseMessage').textContent = error.message);
})();
