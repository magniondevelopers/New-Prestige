/* ============================================================
   prestige-inquiry.js
   Sends every website form submission to the admin panel
   ("Contact Inquiries") via website-api.php?action=submit_inquiry.
   No WhatsApp / email redirects.
   ============================================================ */
(function () {
  var API = 'https://app.prestigevacations.in/website-media/website-api.php';

  /**
   * PrestigeInquiry.submit(payload)
   * payload: { name, phone, email, subject, message, formType, details:{label:value} }
   * Resolves on success, rejects on failure.
   */
  async function submit(payload) {
    var details = payload.details || {};
    var lines = Object.keys(details)
      .filter(function (k) { return details[k] !== '' && details[k] != null; })
      .map(function (k) { return k + ': ' + details[k]; });

    // Extra fields are also folded into the message so they are always
    // visible in the admin panel, even if the API ignores unknown fields.
    var message = (payload.message || '').trim();
    if (lines.length) {
      message = (message ? message + '\n\n' : '') + '— Details —\n' + lines.join('\n');
    }

    var body = Object.assign({}, payload, {
      message: message || '—',
      page: location.pathname.split('/').pop() || 'index.html',
      submittedAt: new Date().toISOString()
    });

    var res = await fetch(API + '?action=submit_inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var json = null;
    try { json = await res.json(); } catch (e) { /* non-JSON is fine */ }
    if (json && (json.ok === false || json.error)) throw new Error(json.error || 'Submission failed');
    return json;
  }

  /** Small helper: wire a button to collect fields, validate, submit and show success. */
  function bindForm(opts) {
    var btn = document.getElementById(opts.button);
    if (!btn) return;
    btn.addEventListener('click', async function (ev) {
      ev.preventDefault();
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var data = opts.collect(v);
      if (!data.name || !data.phone) { alert('Please enter your name and phone number.'); return; }
      if (!/^[+\d][\d\s-]{7,}$/.test(data.phone)) { alert('Please enter a valid phone number.'); return; }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { alert('Please enter a valid email address.'); return; }

      var original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
      try {
        await submit(data);
        var form = document.getElementById(opts.form);
        var ok = document.getElementById(opts.success);
        if (form) form.style.display = 'none';
        if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      } catch (e) {
        console.error('Inquiry error:', e);
        alert('Sorry, we could not send your enquiry right now. Please try again, or call us on 1800 121 3457.');
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  }

  window.PrestigeInquiry = { submit: submit, bindForm: bindForm };
})();
