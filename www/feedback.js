/* App Studio feedback kit (MD 2026-11-01 #4: users tell US what is wrong before they write a 1-star review).
   Use: set window.APP_FEEDBACK = {app:'সহজ জমির হিসাব', pkg:'com.x.y', version:'1.0 (1)', email:'<listing contact email>',
   lang:'bn'|'en'} then <script src="feedback.js"></script>. Adds:
   - a small "মতামত" / "Feedback" button (bottom-left, above any banner ad) -> 3 choices: problem / idea / I like it
     problem + idea -> e-mail draft to the developer with app, version, phone model + the screen name prefilled;
     "I like it" -> Play Store page (rating) - only happy users are sent to the store.
   - after the 5th open, one gentle question "অ্যাপটা কেমন লাগছে?" (never again after an answer; never on the first screen
     of the first open). No internet, no tracking: nothing is sent unless the user sends the e-mail himself. */
(function () {
  var C = window.APP_FEEDBACK || {}; var bn = (C.lang || 'bn') === 'bn';
  var T = bn ? { btn: 'মতামত', q: 'অ্যাপটা কেমন লাগছে?', bad: 'সমস্যা জানাই', idea: 'একটা পরামর্শ', good: 'ভালো লাগছে 👍',
                 later: 'পরে', thanks: 'ধন্যবাদ! Play Store-এ ২ লাইন লিখলে অনেকের উপকার হবে।', subjBad: 'সমস্যা', subjIdea: 'পরামর্শ',
                 body: 'কী হয়েছে / কী চান (এখানে লিখুন):\n\n\n' }
               : { btn: 'Feedback', q: 'How do you like the app?', bad: 'Report a problem', idea: 'Suggest an idea',
                 good: 'I like it 👍', later: 'Later', thanks: 'Thank you! A short Play Store review helps others find it.',
                 subjBad: 'Problem', subjIdea: 'Idea', body: 'What happened / what you want (write here):\n\n\n' };
  function get(k) { try { return localStorage.getItem('fb_' + k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem('fb_' + k, v); } catch (e) {} }
  function mail(kind) {
    var info = '\n---\n' + (C.app || '') + ' ' + (C.version || '') + '\n' + navigator.userAgent.replace(/^.*?\(([^)]*)\).*$/, '$1') +
               '\nscreen: ' + (document.title || location.hash || '');
    location.href = 'mailto:' + (C.email || '') + '?subject=' + encodeURIComponent((C.app || 'App') + ' - ' + kind) +
                    '&body=' + encodeURIComponent(T.body + info);
  }
  function store() { if (C.pkg) location.href = 'market://details?id=' + C.pkg; }
  function sheet(withLater) {
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:flex-end;justify-content:center';
    var b = document.createElement('div');
    b.style.cssText = 'background:#fff;color:#222;width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px 16px 22px;font-size:18px;font-family:inherit';
    b.innerHTML = '<div style="font-weight:700;margin-bottom:12px">' + T.q + '</div>';
    [[T.good, function () { set('done', 1); alertish(T.thanks, store); }], [T.bad, function () { set('done', 1); mail(T.subjBad); }],
     [T.idea, function () { mail(T.subjIdea); }]].concat(withLater ? [[T.later, function () {}]] : []).forEach(function (x) {
      var k = document.createElement('button'); k.textContent = x[0];
      k.style.cssText = 'display:block;width:100%;min-height:52px;margin:8px 0;border:1px solid #ddd;border-radius:12px;background:#f6f7f9;font-size:18px;font-family:inherit';
      k.onclick = function () { document.body.removeChild(o); x[1](); }; b.appendChild(k);
    });
    o.onclick = function (e) { if (e.target === o) document.body.removeChild(o); };
    o.appendChild(b); document.body.appendChild(o);
  }
  function alertish(msg, then) {
    var t = document.createElement('div'); t.textContent = msg;
    t.style.cssText = 'position:fixed;left:16px;right:16px;bottom:90px;background:#222;color:#fff;padding:14px;border-radius:12px;z-index:99999;font-size:17px;text-align:center';
    document.body.appendChild(t); setTimeout(function () { t.remove(); then && then(); }, 2200);
  }
  function init() {
    var f = document.createElement('button'); f.textContent = T.btn; f.setAttribute('aria-label', T.btn);
    f.style.cssText = 'position:fixed;left:10px;bottom:' + (C.bottom || 70) + 'px;z-index:9999;min-height:44px;padding:0 14px;border-radius:22px;border:0;background:rgba(30,30,30,.75);color:#fff;font-size:15px;font-family:inherit';
    f.onclick = function () { sheet(false); }; document.body.appendChild(f);
    var n = +(get('opens') || 0) + 1; set('opens', n);
    if (n === 5 && !get('done')) setTimeout(function () { sheet(true); }, 20000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
