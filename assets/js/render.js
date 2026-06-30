/* ============================================================================
   render.js — Gua Tempurung
   The shared, device-agnostic glue: event delegation + binding + list render.
   Both desktop and mobile blocks live in the DOM at once; this updates whichever
   is visible. Logic stays here & in store/calendar/booking; layouts stay isolated.
   ============================================================================ */
(function (global) {
  'use strict';

  var actions = {};

  /* Register a named action. Triggered by clicking any [data-action="name"]. */
  function onAction(name, fn) { actions[name] = fn; }

  /* One delegated click listener for the whole document. */
  function initDelegation() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      var fn = actions[el.getAttribute('data-action')];
      if (!fn) return;
      e.preventDefault();
      fn(el.getAttribute('data-arg'), el);
    });
  }

  /* Apply a values map to the DOM (runs over BOTH view blocks).
       [data-bind="key"]        -> textContent = values[key]
       [data-bind-html="key"]   -> innerHTML   = values[key]  (trusted: our own SVG/markup)
       [data-bind-style="key"]  -> style.cssText = values[key]
       [data-show="key"]        -> shown when values[key] is truthy (uses [hidden])
       [data-active="key"]      -> toggles .is-active when values[key] is truthy
  */
  function apply(values, root) {
    root = root || document;
    each(root, '[data-bind]', function (el) {
      var k = el.getAttribute('data-bind');
      if (k in values) el.textContent = values[k];
    });
    each(root, '[data-bind-html]', function (el) {
      var k = el.getAttribute('data-bind-html');
      if (k in values) el.innerHTML = values[k];
    });
    each(root, '[data-bind-style]', function (el) {
      var k = el.getAttribute('data-bind-style');
      if (k in values) el.style.cssText = values[k];
    });
    each(root, '[data-show]', function (el) {
      var k = el.getAttribute('data-show');
      if (k in values) el.hidden = !values[k];
    });
    each(root, '[data-active]', function (el) {
      var k = el.getAttribute('data-active');
      if (k in values) el.classList.toggle('is-active', !!values[k]);
    });
  }

  /* Render a list into every container matching `selector`.
     `tpl(item, index)` returns an HTML string. */
  function list(selector, items, tpl, root) {
    each(root || document, selector, function (container) {
      var html = '';
      for (var i = 0; i < items.length; i++) html += tpl(items[i], i);
      container.innerHTML = html;
    });
  }

  /* Show exactly one panel within a group: [data-panel-group="g"] holds
     [data-panel="name"] children; the one matching `name` is shown. */
  function showPanel(group, name, root) {
    each(root || document, '[data-panel-group="' + group + '"] [data-panel]', function (el) {
      el.hidden = el.getAttribute('data-panel') !== name;
    });
  }

  /* Toggle .is-active on tab buttons in a group based on their data-tab value. */
  function setActiveTab(group, name, root) {
    each(root || document, '[data-tab-group="' + group + '"] [data-tab]', function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-tab') === name);
    });
  }

  /* --- helpers --- */
  function each(root, sel, fn) {
    var nodes = root.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) fn(nodes[i]);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  initDelegation();

  global.App = {
    onAction: onAction, apply: apply, list: list,
    showPanel: showPanel, setActiveTab: setActiveTab,
    each: each, escapeHtml: escapeHtml, ready: ready
  };
})(window);
