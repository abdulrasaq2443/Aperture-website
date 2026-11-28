/* Aperture website interactions. Everything still reads fine if this file does not load. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Menu button + drop-down (same on every page) */
  var btn = $("#menuBtn"), panel = $("#menuPanel"), scrim = $("#scrim");
  function setMenu(open) {
    if (!btn || !panel) return;
    panel.classList.toggle("open", open);
    if (scrim) scrim.classList.toggle("show", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (btn && panel) {
    btn.addEventListener("click", function (e) { e.stopPropagation(); setMenu(!panel.classList.contains("open")); });
    if (scrim) scrim.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("click", function (e) {
      if (panel.classList.contains("open") && !panel.contains(e.target) && e.target !== btn) setMenu(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  }

  /* Top bar shadow and back-to-top button */
  var nav = $(".nav"), top = $(".backtop");
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 12);
    if (top) top.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* In the menu, highlight the section you are looking at (home page only) */
  var spyLinks = $$(".menu-panel a[data-sec]");
  if ("IntersectionObserver" in window && spyLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) spyLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-sec") === e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    spyLinks.forEach(function (a) { var s = document.getElementById(a.getAttribute("data-sec")); if (s) spy.observe(s); });
  }

  /* Boxes: a soft light follows the mouse */
  $$(".card, .bx").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* Pricing: naira / dollars */
  var tbtns = $$(".toggle button");
  tbtns.forEach(function (b) {
    b.addEventListener("click", function () {
      tbtns.forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var cur = b.getAttribute("data-cur");
      $$("[data-ngn]").forEach(function (el) { el.textContent = el.getAttribute("data-" + cur); });
    });
  });

  /* Hero preview tilts a little with the mouse */
  var hero = $(".hero"), prev = $(".preview");
  if (hero && prev && !reduce && window.matchMedia("(hover: hover)").matches) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      prev.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      prev.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    hero.addEventListener("mouseleave", function () { prev.style.setProperty("--ry", "0deg"); prev.style.setProperty("--rx", "0deg"); });
  }

  /* Live search demo: type in the box, or watch it type by itself */
  var input = $("#demoSearch"), grid = $("#demoGrid"), hint = $("#demoHint");
  if (input && grid) {
    var FILLER = { a: 1, an: 1, the: 1, my: 1, with: 1, of: 1, photo: 1, photos: 1, picture: 1, pictures: 1 };
    var stem = function (w) {
      if (w.length <= 3) return w;
      if (/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
      if (/(ss|us|is)$/.test(w)) return w;
      return w.charAt(w.length - 1) === "s" ? w.slice(0, -1) : w;
    };
    var within1 = function (a, b) {
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      var i = 0, j = 0, e = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++e > 1) return false;
        if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
      }
      return e + (a.length - i) + (b.length - j) <= 1;
    };
    var tiles = $$(".tile", grid).map(function (t) {
      return { el: t, tags: (t.getAttribute("data-tags") || "").toLowerCase().split(/\s+/).map(stem) };
    });
    var run = function (q) {
      var words = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      var real = words.filter(function (w) { return !FILLER[w]; });
      words = (real.length ? real : words).map(stem);
      var n = 0;
      tiles.forEach(function (t) {
        var ok = words.length > 0 && words.every(function (w) {
          return t.tags.some(function (tag) { return tag === w || tag.indexOf(w) === 0 || (w.length >= 4 && within1(w, tag)); });
        });
        t.el.classList.toggle("hit", ok);
        t.el.classList.toggle("dim", words.length > 0 && !ok);
        if (ok) n++;
      });
      if (!hint) return;
      hint.textContent = !words.length ? "Type to search these sample photos." : n ? n + " photo" + (n === 1 ? "" : "s") + " found" : "No match in this sample. Try \u201Cbeach\u201D or \u201Creceipt\u201D.";
    };
    var auto = false, timer = null;
    var stopAuto = function () { auto = false; clearTimeout(timer); };
    input.addEventListener("input", function () { stopAuto(); run(input.value); });
    input.addEventListener("focus", stopAuto);

    if (!reduce) {
      var phrases = ["my passport", "recipt", "beach sunset", "family dinner"];
      var pi = 0, ci = 0, erasing = false;
      auto = true;
      var tick = function () {
        if (!auto) return;
        var word = phrases[pi];
        if (!erasing) {
          ci++;
          input.value = word.slice(0, ci);
          run(input.value);
          if (ci === word.length) { erasing = true; timer = setTimeout(tick, 1700); return; }
          timer = setTimeout(tick, 95);
        } else {
          ci -= 2; if (ci < 0) ci = 0;
          input.value = word.slice(0, ci);
          run(input.value);
          if (ci === 0) { erasing = false; pi = (pi + 1) % phrases.length; timer = setTimeout(tick, 450); return; }
          timer = setTimeout(tick, 40);
        }
      };
      tick();
    } else {
      run("");
    }
  }
})();
