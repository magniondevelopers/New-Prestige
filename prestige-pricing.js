/* ============================================================
   prestige-pricing.js
   Loads room / villa pricing managed in the Admin Panel
   ("Room Pricing") and fills it into the page.

   Markup hooks:
     data-pv-room="property/roomId"   price of one room
         data-pv-format="rich"        ₹X<span class="room-price-night">/night</span>
         data-pv-format="text"        ₹X/night   (default)
         data-pv-empty="hide"         hide element if no price (else "On request")
     data-pv-from="property"          lowest visible price in that property
         data-pv-prefix="suite"       ...only rooms whose id starts with this
     data-pv-list="property"          renders full room cards (used by Country Bay)
     data-pv-section="property"       wrapper shown only when the list has rooms
     data-pv-note="property"          property note text (hidden if empty)

   If the API can't be reached, the static prices already in the
   HTML stay as they are (safe fallback).
   ============================================================ */
(function () {
  var PRICING_API = 'https://app.prestigevacations.in/website-media/pricing-api.php?action=get';

  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function priced(r) { return r && r.visible !== false && r.price !== '' && r.price != null && !isNaN(r.price) && Number(r.price) > 0; }
  function unit(r) { return r.unit || 'night'; }

  function apply(data) {
    var props = (data && data.properties) || {};

    document.querySelectorAll('[data-pv-room]').forEach(function (el) {
      var parts = el.getAttribute('data-pv-room').split('/');
      var prop = props[parts[0]] || { rooms: [] };
      var room = (prop.rooms || []).find(function (r) { return r.id === parts[1]; });
      var fmt = el.getAttribute('data-pv-format') || 'text';
      if (priced(room)) {
        el.innerHTML = fmt === 'rich'
          ? inr(room.price) + '<span class="room-price-night">/' + esc(unit(room)) + '</span>'
          : inr(room.price) + '/' + esc(unit(room));
        el.style.display = '';
        var card = el.closest('[data-pv-card]');
        if (card) card.style.display = '';
      } else if (room && room.visible === false && el.closest('[data-pv-card]')) {
        el.closest('[data-pv-card]').style.display = 'none';
      } else if (el.getAttribute('data-pv-empty') === 'hide') {
        el.style.display = 'none';
      } else {
        el.textContent = 'On request';
      }
    });

    document.querySelectorAll('[data-pv-from]').forEach(function (el) {
      var prop = props[el.getAttribute('data-pv-from')] || { rooms: [] };
      var prefix = el.getAttribute('data-pv-prefix') || '';
      var list = (prop.rooms || []).filter(function (r) { return priced(r) && r.id.indexOf(prefix) === 0; });
      if (!list.length) { el.textContent = 'On request'; return; }
      var min = list.reduce(function (a, b) { return Number(b.price) < Number(a.price) ? b : a; });
      var fmt = el.getAttribute('data-pv-format') || 'text';
      el.innerHTML = fmt === 'rich'
        ? inr(min.price) + '<span>/' + esc(unit(min)) + '</span>'
        : inr(min.price) + '/' + esc(unit(min));
    });

    document.querySelectorAll('[data-pv-note]').forEach(function (el) {
      var prop = props[el.getAttribute('data-pv-note')];
      if (prop && prop.note) { el.textContent = prop.note; el.style.display = ''; }
    });

    document.querySelectorAll('[data-pv-list]').forEach(function (el) {
      var key = el.getAttribute('data-pv-list');
      var rooms = ((props[key] || {}).rooms || []).filter(function (r) { return r.visible !== false; });
      var wrap = document.querySelector('[data-pv-section="' + key + '"]');
      if (!rooms.length) { if (wrap) wrap.style.display = 'none'; return; }
      el.innerHTML = rooms.map(function (r) {
        return '<div class="pv-card">' +
          '<div class="pv-card-name">' + esc(r.name) + '</div>' +
          (r.variant ? '<div class="pv-card-variant">' + esc(r.variant) + '</div>' : '') +
          (r.description ? '<p class="pv-card-desc">' + esc(r.description) + '</p>' : '') +
          '<div class="pv-card-foot"><div><div class="pv-card-label">Starting From</div>' +
          '<div class="pv-card-price">' + (priced(r) ? inr(r.price) + '<span>/' + esc(unit(r)) + '</span>' : 'On request') + '</div></div>' +
          '<a href="#register" class="pv-card-cta">Enquire <i class="fa-solid fa-arrow-right"></i></a></div>' +
          '</div>';
      }).join('');
      if (wrap) wrap.style.display = '';
    });
  }

  function load() {
    fetch(PRICING_API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(apply)
      .catch(function (e) { console.warn('Pricing: using static fallback', e); });
  }

  if (document.readyState !== 'loading') load();
  else document.addEventListener('DOMContentLoaded', load);
})();
