/* SmartPLC — HTML + CSS + JS + GSAP + Chart.js, sem build/bundler.
   GSAP, ScrollTrigger e Chart.js são carregados via <script> comuns
   (vendor/*.js) antes deste arquivo. */
(function () {
  "use strict";

  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  gsap.registerPlugin(ScrollTrigger);

  /* ---- Hero · SmartPLC Loop: única animação da seção, ligada ao scroll.
     Abre em 64.7 — o mesmo valor do HTML, portanto idêntico sem JS e com
     reduced motion — e sobe até o SP (70.0) conforme o Hero sai da tela.
     Sobe, nunca desce: "rolar é encher o tanque" (01-conceito.md). O que o
     movimento mede é a malha convergindo no setpoint (06-motion.md).
     Sem risco de DESVIO: |PV − SP| só encolhe (5.3 → 0), nunca passa da
     banda de 10. Não é preciso `set` síncrono: o markup já nasce em 64.7. ---- */
  (function heroLoop() {
    var hero = document.getElementById("hero");
    var loop = hero && hero.querySelector(".smartplc-loop");
    if (!hero || !loop || !window.SmartPLCLoop || reducedMotion) return;

    var proxy = { pv: 64.7 };
    gsap.to(proxy, {
      pv: 70,
      ease: "none",
      onUpdate: function () { SmartPLCLoop.set(loop, { pv: proxy.pv }); },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });
  })();

  /* ---- Hero · pulsos e LED animados. Sem editar smartplc-loop.js: só
     manipula por fora os elementos que o componente já desenha
     (.spl-pulse, .spl-active, .spl-led). Pausa quando o Hero sai da
     viewport — não fica rodando o tempo todo. ---- */
  (function heroPulses() {
    var hero = document.getElementById("hero");
    var loop = hero && hero.querySelector(".smartplc-loop");
    if (!hero || !loop || reducedMotion) return;

    var pulses = loop.querySelectorAll(".spl-pulse");
    var active = loop.querySelectorAll(".spl-active");
    var leds = loop.querySelectorAll(".spl-led");
    if (!pulses.length && !active.length && !leds.length) return;

    var tl = gsap.timeline({ paused: true, repeat: -1 });

    pulses.forEach(function (el, i) {
      tl.fromTo(
        el,
        { opacity: 0.15, scale: 0.7, transformOrigin: "50% 50%" },
        { opacity: 1, scale: 1.15, duration: 0.5, ease: "power1.inOut", yoyo: true, repeat: 1 },
        i * 0.35
      );
    });
    active.forEach(function (el) {
      tl.to(el, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 3, ease: "none" }, 0);
    });
    if (leds.length) {
      tl.set(leds, { fill: cssVar("--hairline-field") }, 0);
      leds.forEach(function (el, i) {
        tl.to(el, { attr: { fill: cssVar("--signal") }, duration: 0.15 }, i * 0.3)
          .to(el, { attr: { fill: cssVar("--hairline-field") }, duration: 0.15 }, i * 0.3 + 0.5);
      });
    }

    ScrollTrigger.create({
      trigger: hero,
      start: "top bottom",
      end: "bottom top",
      onEnter: function () { tl.play(); },
      onEnterBack: function () { tl.play(); },
      onLeave: function () { tl.pause(); },
      onLeaveBack: function () { tl.pause(); },
    });
  })();

  /* ---- Seção 2 · Problema: A/B/C em revelação grande, pinada, puxando da
     linha que corta "bancada". Sem JS / reduced motion: .notas fica no
     grid normal (já no HTML), então não perde informação. ---- */
  (function abcReveal() {
    var pin = document.getElementById("abc-pin");
    var notas = pin ? [].slice.call(pin.querySelectorAll(".nota")) : [];
    // "Nenhum pin no mobile" (v2-direcao.md, Movimento) — abaixo de 1024px
    // fica no grid normal (já legível, é o mesmo fallback do no-JS/reduced
    // motion), sem tentar comprimir a revelação grande numa tela estreita.
    if (!pin || !notas.length || reducedMotion || !window.matchMedia("(min-width: 1024px)").matches) return;

    pin.classList.add("js-abc");
    gsap.set(notas[0], { opacity: 1 });
    gsap.set(notas.slice(1), { opacity: 0 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=" + notas.length * 100 + "%",
        scrub: 0.6,
        pin: true,
      },
    });
    notas.forEach(function (el, i) {
      if (i > 0) {
        tl.to(notas[i - 1], { opacity: 0, scale: 0.94, duration: 0.3 }, ">0.15");
        tl.to(el, { opacity: 1, scale: 1, duration: 0.4 }, "<");
      }
    });
  })();

  /* Malha de 1ª ordem com controle P na válvula de entrada — mesma
     matemática de guidelines/09-componentes.md. */
  function makeSim(pv, sp, tau) {
    var s = { pv: pv, sp: sp, valve: 0.5, tau: tau || 4 };
    s.step = function (dt) {
      var e = s.sp - s.pv;
      s.valve = clamp(0.45 + e * 0.06, 0, 1);
      s.pv += e * (dt / s.tau) + (Math.random() - 0.5) * 0.04;
      s.pv = clamp(s.pv, 0, 100);
    };
    return s;
  }

  function runLoop(fn) {
    var last = performance.now(), alive = true;
    function frame(now) {
      if (!alive) return;
      var dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      fn(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function () { alive = false; };
  }

  /* ---- Gráfico de tendência (Chart.js) + revelação ligada ao scroll (GSAP
     ScrollTrigger anima o clip-path do contêiner, não o Chart.js em si —
     o Chart.js só desenha; quem "acompanha o scroll" é o clip). ---- */
  function makeTrendChart(canvas, points) {
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map(function (_, i) { return i; }),
        datasets: [{
          data: points,
          borderColor: cssVar("--signal"),
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: function (ctx) { return ctx.dataIndex === points.length - 1 ? 3 : 0; },
          pointBackgroundColor: cssVar("--signal"),
        }],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 100 },
        },
      },
    });
  }

  function revealOnScroll(wrapperEl) {
    if (!wrapperEl) return;
    if (reducedMotion) {
      wrapperEl.style.clipPath = "inset(0 0 0 0)";
      return;
    }
    wrapperEl.style.clipPath = "inset(0 100% 0 0)";
    gsap.to(wrapperEl, {
      clipPath: "inset(0 0% 0 0)",
      ease: "none",
      scrollTrigger: {
        trigger: wrapperEl,
        start: "top 90%",
        end: "top 55%",
        scrub: 0.6,
      },
    });
  }

  var TREND_POINTS = [38, 44, 41, 52, 58, 64.7];

  var trendCanvas = document.getElementById("trend-chart");
  if (trendCanvas) {
    makeTrendChart(trendCanvas, TREND_POINTS);
    revealOnScroll(document.getElementById("trend-chart-reveal"));
  }
  var finalCanvas = document.getElementById("final-chart");
  if (finalCanvas) {
    makeTrendChart(finalCanvas, TREND_POINTS);
    revealOnScroll(document.getElementById("final-chart-reveal"));
  }

  /* ---- Seção 3 · Malha: preenchimento de entrada ligado ao scroll,
     depois arrastar o SP assume e a PV persegue (1ª ordem). ---- */
  (function malha() {
    var tankWord = document.getElementById("malha-tankword");
    var legend = document.getElementById("malha-legend");
    var slider = document.getElementById("malha-sp-input");
    var spValueEl = document.getElementById("malha-sp-value");
    var pvValueEl = document.getElementById("malha-pv-value");
    if (!tankWord || !legend || !slider) return;

    var X0 = 64, X1 = 204, TOP = 78, BOT = 379;
    function y(p) { return BOT - (p / 100) * (BOT - TOP); }

    legend.innerHTML =
      '<path d="M78 380 V404 M190 380 V404 M70 404 H86 M182 404 H198" class="pipe"></path>' +
      '<rect x="' + (X0 - 1) + '" y="70" width="' + (X1 - X0 + 2) + '" height="310" class="shell-fill"></rect>' +
      '<path data-role="liquid" class="liquid"></path>' +
      '<line data-role="meniscus" x1="' + X0 + '" x2="' + X1 + '" class="meniscus"></line>' +
      '<path d="M' + X0 + ' 70 V380 H' + X1 + ' V70" class="shell"></path>' +
      '<path d="M' + (X0 - 6) + ' 70 H' + (X1 + 6) + ' M' + (X0 - 6) + ' 66 H' + (X1 + 6) + '" class="shell"></path>' +
      '<path d="M104 66 V46" class="pipe"></path>' +
      '<circle cx="104" cy="30" r="16" class="inst"></circle>' +
      '<text x="104" y="29" text-anchor="middle" class="txt-ink">LT</text>' +
      '<text x="104" y="40" text-anchor="middle" class="txt">101</text>' +
      '<line data-role="sp-line" x1="40" x2="300" class="sp"></line>' +
      '<text data-role="sp-text" x="' + (X1 + 10) + '" class="txt-ink"></text>' +
      '<g data-role="pv-chip"><rect x="' + (X1 + 8) + '" y="-9" width="72" height="18" class="pv-chip"></rect>' +
      '<text data-role="pv-chip-text" x="' + (X1 + 14) + '" y="4" class="pv-chip-txt"></text></g>';

    var liquidEl = legend.querySelector('[data-role="liquid"]');
    var meniscusEl = legend.querySelector('[data-role="meniscus"]');
    var spLineEl = legend.querySelector('[data-role="sp-line"]');
    var spTextEl = legend.querySelector('[data-role="sp-text"]');
    var pvChipEl = legend.querySelector('[data-role="pv-chip"]');
    var pvChipTextEl = legend.querySelector('[data-role="pv-chip-text"]');

    var state = makeSim(0, Number(slider.value), 4);
    var stopLoop = null;

    function paint() {
      tankWord.style.setProperty("--level", state.pv.toFixed(2));
      tankWord.style.setProperty("--sp", state.sp.toFixed(2));
      if (spValueEl) spValueEl.textContent = fmt(state.sp);
      if (pvValueEl) pvValueEl.textContent = fmt(state.pv);

      var ly = y(state.pv).toFixed(2);
      liquidEl.setAttribute("d", "M" + X0 + " " + ly + " L" + X1 + " " + ly + " L" + X1 + " " + BOT + " L" + X0 + " " + BOT + " Z");
      meniscusEl.setAttribute("y1", ly);
      meniscusEl.setAttribute("y2", ly);
      pvChipEl.setAttribute("transform", "translate(0 " + ly + ")");
      pvChipTextEl.textContent = "PV " + fmt(state.pv);

      var spY = y(state.sp).toFixed(2);
      spLineEl.setAttribute("y1", spY);
      spLineEl.setAttribute("y2", spY);
      spTextEl.setAttribute("y", String(Number(spY) - 6));
      spTextEl.textContent = "SP " + fmt(state.sp);
    }

    function ensureLoopRunning() {
      if (stopLoop) return;
      stopLoop = runLoop(function (dt) {
        state.step(dt);
        paint();
      });
    }

    paint();

    var scrolling = true;
    var trigger = null;

    if (reducedMotion) {
      state.pv = state.sp;
      paint();
      scrolling = false;
    } else {
      var proxy = { pv: 0 };
      var tween = gsap.to(proxy, {
        pv: state.sp,
        ease: "none",
        onUpdate: function () {
          if (!scrolling) return;
          state.pv = proxy.pv;
          paint();
        },
        scrollTrigger: {
          trigger: tankWord,
          start: "top 95%",
          end: "top 25%",
          scrub: 0.6,
        },
      });
      trigger = tween.scrollTrigger;
    }

    slider.addEventListener("input", function () {
      if (scrolling) {
        scrolling = false;
        if (trigger) trigger.kill();
      }
      state.sp = Number(slider.value);
      if (reducedMotion) {
        state.pv = state.sp;
        paint();
      } else {
        ensureLoopRunning();
      }
    });
  })();

  /* ---- Régua de nível: o indicador lime acompanha o progresso de rolagem
     da página inteira (0% no topo → 100% no fim). "O nível é a barra de
     progresso" (01-conceito.md) — os números da régua deixam de ser soltos
     e passam a ser posições reais que o indicador atravessa. ---- */
  (function pageRuler() {
    var dot = document.querySelector(".page-ruler__dot");
    if (!dot || reducedMotion) return;
    gsap.to(dot, {
      top: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  })();

  /* ---- Seção 4 · Do sensor até a tela: diagrama único, traço lime
     percorrendo os 6 nós. Desktop: seção pinada — trava até a medição
     inteira aparecer, como pedido (antes o reveal começava antes do nó
     estar visível). Mobile: sem pin (v2 — "nenhum pin no mobile"), o
     traço/nós acendem com o scroll normal, vertical. ---- */
  (function sensorToScreen() {
    var section = document.getElementById("seis-formas");
    var diagram = document.getElementById("sf-diagram");
    var trace = document.getElementById("sf-trace");
    var nodes = diagram ? [].slice.call(diagram.querySelectorAll(".node")) : [];
    if (!section || !diagram || !trace || !nodes.length) return;

    var n = nodes.length;
    var isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    function setNodes(p, focus) {
      var activeIndex = Math.min(n - 1, Math.floor(p * n));
      nodes.forEach(function (el, i) {
        var on = p > 0 && i <= activeIndex;
        var isFocus = focus && i === activeIndex;
        el.classList.toggle("is-active", on);
        el.classList.toggle("is-focus", isFocus);
        if (focus) {
          // Slide em foco: o nó ativo aumenta de verdade (não 6%) e vem pra
          // frente — texto maior e mais nítido, os outros recuam.
          el.style.opacity = isFocus || i === 0 ? "1" : on ? "0.55" : "0.35";
          el.style.transform = isFocus ? "scale(1.7)" : "scale(0.92)";
        } else {
          el.style.opacity = on || i === 0 ? "1" : "0.15";
        }
      });
    }

    if (reducedMotion) {
      trace.style[isDesktop ? "width" : "height"] = "100%";
      setNodes(1, isDesktop);
      return;
    }

    if (isDesktop) {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=250%",
        scrub: 0.6,
        pin: true,
        onUpdate: function (self) {
          trace.style.width = (self.progress * 100).toFixed(1) + "%";
          setNodes(self.progress, true);
        },
      });
    } else {
      nodes.forEach(function (el, i) { el.style.opacity = i === 0 ? "1" : "0.15"; });
      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        end: "bottom 60%",
        scrub: 0.6,
        onUpdate: function (self) {
          trace.style.height = (self.progress * 100).toFixed(1) + "%";
          setNodes(self.progress, false);
        },
      });
    }
  })();

  /* ---- Seção 6 · Final: "interface" enche até 100% ligado ao scroll ---- */
  (function final() {
    var tankWord = document.getElementById("tank-interface");
    if (!tankWord) return;
    if (reducedMotion) {
      tankWord.style.setProperty("--level", "100");
      return;
    }
    var proxy = { level: 0 };
    tankWord.style.setProperty("--level", "0");
    gsap.to(proxy, {
      level: 100,
      ease: "none",
      onUpdate: function () {
        tankWord.style.setProperty("--level", proxy.level.toFixed(1));
      },
      scrollTrigger: {
        trigger: tankWord,
        start: "top 95%",
        // "interface" é a última palavra da página — em vez de um alvo em
        // % de viewport (frágil: depende do tanto de conteúdo abaixo dela),
        // o fim da animação é o próprio fim real do documento. Sempre
        // alcançável, não importa o tamanho do conteúdo.
        end: "bottom bottom",
        endTrigger: document.body,
        scrub: 0.6,
      },
    });
  })();
})();
