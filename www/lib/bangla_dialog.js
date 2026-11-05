/* Local-only Bangla backup dialogs. Native modal semantics keep the page inert. */
(function (root) {
  'use strict';
  var active = null;
  function open(options, done) {
    if (active) return false;
    var d = document.createElement('dialog'), finished = false;
    d.className = 'bn-dialog';
    d.setAttribute('aria-labelledby', 'backup-dialog-title');
    d.setAttribute('aria-describedby', 'backup-dialog-message');
    function add(tag, text, id) {
      var e = document.createElement(tag); e.textContent = text;
      if (id) e.id = id;
      d.appendChild(e); return e;
    }
    add('h2', options.title, 'backup-dialog-title');
    add('p', options.message, 'backup-dialog-message');
    var input = null;
    if (Object.prototype.hasOwnProperty.call(options, 'value')) {
      input = add('input', ''); input.type = 'text'; input.value = options.value;
      input.readOnly = !!options.readOnly; input.autocomplete = 'off'; input.spellcheck = false;
      input.setAttribute('aria-label', 'ব্যাকআপ কোড');
    }
    var row = add('div', ''); row.className = 'row';
    function finish(value) {
      if (finished) return;
      finished = true; d.close(); d.remove(); active = null;
      if (done) done(value);
    }
    function button(label, cancel) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'btn' + (cancel ? ' alt' : ''); b.textContent = label;
      b.onclick = function () { finish(cancel ? null : (input ? input.value : true)); };
      row.appendChild(b); return b;
    }
    var cancel = options.cancel ? button(options.cancel, true) : null;
    var accept = button(options.accept || 'ঠিক আছে', !options.cancel);
    d.addEventListener('cancel', function (event) { event.preventDefault(); finish(null); });
    // Also clean up if another caller closes the native dialog.
    d.addEventListener('close', function () { if (!finished) finish(null); });
    document.body.appendChild(d); active = d;
    try { d.showModal(); } catch (error) { finished = true; d.remove(); active = null; throw error; }
    (input || cancel || accept).focus();
    if (input && input.readOnly) input.select();
    return true;
  }
  root.BanglaDialog = { open: open };
})(typeof window !== 'undefined' ? window : globalThis);
