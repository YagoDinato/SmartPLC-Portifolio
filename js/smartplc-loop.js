/* SmartPLC — malha de nível: estado e layout (vanilla).
   Reaproveita SmartPLC.fmt / SmartPLC.clamp do ds/bundle.js quando carregado.

   SmartPLCLoop.set(el, { pv: 64.7, sp: 70 })

   Todo o cálculo acontece aqui; o CSS só recebe valores prontos:
   - atributos SVG (y/height do líquido, translate do menisco e da SP);
   - left/top em % para os rótulos HTML;
   - --pv / --sp como espelho do estado, para quem quiser ler no CSS. */
(function () {
  var S = window.SmartPLC || {};
  var fmt = S.fmt || function (v) { return (Math.round(v * 10) / 10).toFixed(1); };
  var clamp = S.clamp || function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var Y0 = 680, SPAN = 4.8, VBH = 800;          // 0 % em y=680, 100 % em y=200 (unidades do viewBox)
  var VBW = { desktop: 720, mobile: 580 };      // largura visível do viewBox por layout
  var BREAK = 640;                              // largura do componente (px) abaixo da qual vira mobile

  function pct(v, base) { return (v / base * 100).toFixed(3) + '%'; }
  function q(el, s) { return el.querySelector(s); }
  function each(el, s, fn) { Array.prototype.forEach.call(el.querySelectorAll(s), fn); }

  function layout(el) {
    var mode = el.clientWidth > 0 && el.clientWidth <= BREAK ? 'mobile' : 'desktop';
    if (el.dataset.layout !== mode) el.dataset.layout = mode;
    var vbw = VBW[mode];
    each(el, '[data-x]', function (n) { n.style.left = pct(Number(n.dataset.x), vbw); });
    each(el, '[data-y]', function (n) { n.style.top = pct(Number(n.dataset.y), VBH); });
  }

  function set(el, values) {
    values = values || {};
    var pv = clamp(Number(values.pv != null ? values.pv : el.dataset.pv), 0, 100);
    var sp = clamp(Number(values.sp != null ? values.sp : el.dataset.sp), 0, 100);
    var h = pv * SPAN, s = sp * SPAN;

    var liquid = q(el, '.spl-liquid');
    liquid.setAttribute('y', (Y0 - h).toFixed(2));
    liquid.setAttribute('height', h.toFixed(2));
    q(el, '.spl-pv-track').setAttribute('transform', 'translate(0 ' + (-h).toFixed(2) + ')');
    q(el, '.spl-sp-track').setAttribute('transform', 'translate(0 ' + (-s).toFixed(2) + ')');
    each(el, '.spl-pv-float', function (n) { n.style.top = pct(Y0 - h, VBH); });
    each(el, '.spl-sp-float', function (n) { n.style.top = pct(Y0 - s, VBH); });

    each(el, '[data-pv]:not(.smartplc-loop)', function (n) { n.textContent = fmt(pv); });
    each(el, '[data-sp]:not(.smartplc-loop)', function (n) { n.textContent = fmt(sp); });

    /* Regra visual da demonstração (não é um limite industrial):
       quando |PV − SP| passa de data-band pontos, PV fica em laranja com o rótulo DESVIO. */
    var band = Number(el.dataset.band || 10);
    var dev = Math.abs(pv - sp) > band;
    el.dataset.deviation = String(dev);
    each(el, '.spc-readout.pv', function (n) { n.classList.toggle('is-alarm', dev); });
    each(el, '.spc-readout.pv .alm', function (n) { n.hidden = !dev; });

    el.dataset.spSubmerged = String(sp < pv);
    el.dataset.pv = fmt(pv);
    el.dataset.sp = fmt(sp);
    el.style.setProperty('--pv', pv);
    el.style.setProperty('--sp', sp);
    el.setAttribute('aria-label', 'Malha de nível: PV ' + fmt(pv) + ' %, SP ' + fmt(sp) + ' %');
    return { pv: pv, sp: sp };
  }

  function init(el) {
    el.dataset.ready = '';
    layout(el);
    if (window.ResizeObserver) new ResizeObserver(function () { layout(el); }).observe(el);
    else window.addEventListener('resize', function () { layout(el); });
    return set(el, {});
  }

  window.SmartPLCLoop = { set: set, init: init, layout: layout };
  each(document, '.smartplc-loop', init);
})();
