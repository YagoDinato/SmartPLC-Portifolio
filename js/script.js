(function () {
  "use strict";
  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmt(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  gsap.registerPlugin(ScrollTrigger);
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
  (function abcReveal() {
    var pin = document.getElementById("abc-pin");
    var notas = pin ? [].slice.call(pin.querySelectorAll(".nota")) : [];
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
  }
  var finalCanvas = document.getElementById("final-chart");
  if (finalCanvas) {
    makeTrendChart(finalCanvas, TREND_POINTS);
    revealOnScroll(document.getElementById("final-chart-reveal"));
  }
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
  (function pageRuler() {
    var dot = document.querySelector(".page-ruler__dot");
    if (!dot || reducedMotion) return;
    gsap.to(dot, {
      top: "100%",
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: true,
      },
    });
  })();
  (function sensorToScreen() {
    var pin = document.getElementById("sf-steps");
    var steps = pin ? [].slice.call(pin.querySelectorAll(".sf-step")) : [];
    if (!pin || !steps.length) return;
    var underlines = steps.map(function (el) { return el.querySelector(".sf-step__underline"); });
    var isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (reducedMotion) return;
    if (isDesktop) {
      pin.classList.add("js-sf");
      var railTrace = document.getElementById("sf-rail-trace");
      var railStops = [].slice.call(pin.querySelectorAll(".sf-rail__stop"));
      var railDots = railStops.map(function (s) { return s.querySelector(".sf-rail__dot"); });
      function markRail(i) {
        railStops.forEach(function (s, si) {
          s.classList.toggle("is-active", si === i);
          s.classList.toggle("is-done", si < i);
        });
        railDots.forEach(function (d, di) { d.classList.toggle("is-active", di <= i); });
      }
      gsap.set(steps[0], { opacity: 1, y: 0, filter: "blur(0px)" });
      gsap.set(steps.slice(1), { opacity: 0, y: 36, filter: "blur(6px)" });
      gsap.set(underlines, { scaleX: 0 });
      markRail(0);
      var rail = document.getElementById("sf-rail");
      var finale = document.getElementById("sf-finale");
      gsap.set(finale, { opacity: 0, y: 16 });
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + (steps.length + 1) * 100 + "%",
          scrub: 0.6,
          pin: true,
        },
      });
      tl.to(underlines[0], { scaleX: 1, duration: 0.35, ease: "power2.out" }, 0);
      if (railTrace) tl.to(railTrace, { width: (100 / steps.length).toFixed(2) + "%", duration: 0.3 }, 0);
      steps.forEach(function (el, i) {
        if (i > 0) {
          tl.to(steps[i - 1], { opacity: 0, y: -36, filter: "blur(6px)", duration: 0.35, ease: "power1.in" });
          tl.to(el, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power2.out" });
          tl.to(underlines[i], { scaleX: 1, duration: 0.3, ease: "power2.out" }, "<0.12");
          if (railTrace) tl.to(railTrace, { width: ((i + 1) * 100 / steps.length).toFixed(2) + "%", duration: 0.3 }, "<");
          tl.call(markRail, [i], "<");
        }
      });
      tl.to(steps[steps.length - 1], { opacity: 0, y: -36, filter: "blur(6px)", duration: 0.35, ease: "power1.in" });
      if (rail) {
        gsap.set(rail, { maxWidth: "none" });
        tl.to(rail, { left: "50%", xPercent: -50, top: "44%", yPercent: -50, width: "min(1100px, 92vw)", duration: 0.6, ease: "power2.inOut" }, "<");
      }
      tl.call(function () {
        railStops.forEach(function (s) { s.classList.add("is-done"); s.classList.remove("is-active"); });
        railDots.forEach(function (d) { d.classList.add("is-active"); });
        if (rail) rail.classList.add("is-finale");
      }, [], "<");
      tl.to(finale, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "<0.3");
    } else {
      steps.forEach(function (el, i) {
        var underline = underlines[i];
        gsap.set(underline, { scaleX: 0 });
        gsap.set(el, { opacity: 0, y: 16 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          once: true,
          onEnter: function () {
            gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
            gsap.to(underline, { scaleX: 1, duration: 0.4, ease: "power2.out", delay: 0.12 });
          },
        });
      });
    }
  })();
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
        end: "bottom bottom",
        endTrigger: document.body,
        scrub: 0.6,
      },
    });
  })();
})();
