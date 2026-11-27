/* Aperture website interactions. Everything still reads fine if this file does not load. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Scroll progress bar, nav shadow, back-to-top button, steps line */
  var bar = $(".progress"), nav = $(".nav"), top = $(".backtop"), steps = $(".steps");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = window.pageYOffset || h.scrollTop;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("scrolled", y > 12);
    if (top) top.classList.toggle("show", y > 700);
    if (steps) {
      var r = steps.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.75 - r.top) / (r.height + vh * 0.2);
      steps.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* Mobile menu */
  var btn = $(".menu-btn"), links = $(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", function () { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }); });
  }

  /* Reveal on scroll, with a small stagger inside groups */
  var rv = $$(".rv");
  rv.forEach(function (el) {
    var group = el.parentElement;
    if (group && group.hasAttribute("data-stagger")) {
      var i = $$(".rv", group).indexOf(el);
      el.style.setProperty("--d", (i * 0.09).toFixed(2) + "s");
    }
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* Highlight the nav link of the section on screen */
  var navLinks = $$(".nav-links a[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* Cards: soft light that follows the mouse */
  $$(".card").forEach(function (c) {
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

  /* Hero preview: tilts a little with the mouse */
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
    var tiles = $$(".tile", grid).map(function (t) {
      return { el: t, tags: (t.getAttribute("data-tags") || "").toLowerCase().split(/\s+/).map(stem) };
    });
    var FILLER = { a: 1, an: 1, the: 1, my: 1, with: 1, of: 1, photo: 1, photos: 1, picture: 1, pictures: 1 };
    function stem(w) {
      if (w.length <= 3) return w;
      if (/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
      if (/(ss|us|is)$/.test(w)) return w;
      return w.charAt(w.length - 1) === "s" ? w.slice(0, -1) : w;
    }
    function within1(a, b) {
      if (a === b) return true;
      if (Math.abs(a.length - b.length) > 1) return false;
      var i = 0, j = 0, e = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++e > 1) return false;
        if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
      }
      return e + (a.length - i) + (b.length - j) <= 1;
    }
    function run(q) {
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
    }
    input.addEventListener("input", function () { stopAuto(); run(input.value); });
    input.addEventListener("focus", stopAuto);

    var auto = null, timer = null;
    function stopAuto() { auto = false; clearTimeout(timer); }
    if (!reduce) {
      var phrases = ["my passport", "recipt", "beach sunset", "family dinner"];
      var pi = 0, ci = 0, erasing = false;
      auto = true;
      (function tick() {
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
      })();
    } else {
      run("");
    }
  }
})();
