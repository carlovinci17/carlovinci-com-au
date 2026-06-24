/* ============================================================
   Carlo Vinci — Portfolio interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- years of experience (auto-increments yearly) ---------- */
  var CAREER_START = 1999; // 27+ years as of 2026
  var years = Math.max(1, new Date().getFullYear() - CAREER_START);
  document.querySelectorAll(".js-years").forEach(function (el) {
    el.textContent = String(years);
  });

  /* ---------- theme ---------- */
  var THEME_KEY = "cv-theme";
  var root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var isDark = theme === "dark";
    var sun = document.querySelector(".i-sun");
    var moon = document.querySelector(".i-moon");
    if (sun && moon) {
      sun.style.display = isDark ? "none" : "";
      moon.style.display = isDark ? "" : "none";
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  // expose so the Tweaks panel can drive the same source of truth
  window.cvSetTheme = applyTheme;
  window.cvGetTheme = function () { return root.getAttribute("data-theme") || "light"; };

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved) { applyTheme(saved); }
    else {
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  })();

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      applyTheme(window.cvGetTheme() === "dark" ? "light" : "dark");
      window.dispatchEvent(new CustomEvent("cv-theme-change"));
    });
  }

  /* ---------- nav stuck state ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    var setMenu = function (open) {
      mobileMenu.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", function () {
      setMenu(!mobileMenu.classList.contains("open"));
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.style.transition = "none";
        setMenu(false);
        setTimeout(function () { mobileMenu.style.transition = ""; }, 50);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- project filtering ---------- */
  var filters = document.getElementById("filters");
  var grid = document.getElementById("proj-grid");
  var empty = document.getElementById("proj-empty");
  if (filters && grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".proj"));
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      filters.querySelectorAll(".filter").forEach(function (f) { f.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var key = btn.getAttribute("data-filter");
      var shown = 0;
      cards.forEach(function (card) {
        var match = key === "all" || (" " + card.getAttribute("data-cat") + " ").indexOf(" " + key + " ") !== -1;
        card.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (empty) empty.style.display = shown === 0 ? "block" : "none";
    });
  }

  /* ---------- github contribution graph ---------- */
  var contrib = document.getElementById("contrib");
  if (contrib) {
    var WEEKS = 52, DAYS = 7;
    var frag = document.createDocumentFragment();
    // deterministic-ish pattern with weekday bias + occasional streaks
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var w = 0; w < WEEKS; w++) {
      var streak = rnd() < 0.18 ? 1 : 0; // busy weeks
      for (var d = 0; d < DAYS; d++) {
        var cell = document.createElement("i");
        var base = rnd();
        var weekend = (d === 0 || d === 6) ? 0.35 : 1;
        var v = base * weekend + streak * 0.4;
        var level = v < 0.32 ? 0 : v < 0.55 ? 1 : v < 0.74 ? 2 : v < 0.9 ? 3 : 4;
        cell.setAttribute("data-l", String(level));
        frag.appendChild(cell);
      }
    }
    contrib.appendChild(frag);
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  function revealEl(el) { el.classList.add("in"); }
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { revealEl(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min((i % 4) * 60, 180) + "ms";
      io.observe(el);
    });
    // Safety net: never let content stay hidden if IO doesn't fire
    // (offscreen/embedded render contexts, prerender, etc.)
    var failsafe = function () {
      reveals.forEach(function (el) { if (!el.classList.contains("in")) revealEl(el); });
    };
    window.addEventListener("load", function () { setTimeout(failsafe, 900); });
    setTimeout(failsafe, 2500);
  } else {
    reveals.forEach(revealEl);
  }

  /* ---------- lightbox ---------- */
  var lbSlides = [];
  var lbIndex = 0;
  var lb = document.getElementById('lightbox');
  var lbImg = lb ? lb.querySelector('.lightbox__img') : null;
  var lbCounter = lb ? lb.querySelector('.lightbox__counter') : null;

  function openLightbox(slides, idx) {
    if (!lb) return;
    lbSlides = slides;
    lbIndex = idx;
    lbImg.src = slides[idx].src;
    lbImg.alt = slides[idx].alt;
    lbImg.style.opacity = '1';
    updateCounter();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function lbGo(n) {
    if (!lbSlides.length) return;
    lbIndex = (n + lbSlides.length) % lbSlides.length;
    lbImg.style.opacity = '0';
    setTimeout(function () {
      lbImg.src = lbSlides[lbIndex].src;
      lbImg.alt = lbSlides[lbIndex].alt;
      lbImg.style.opacity = '1';
      updateCounter();
    }, 150);
  }

  function updateCounter() {
    if (!lbCounter) return;
    lbCounter.textContent = lbSlides.length > 1 ? (lbIndex + 1) + ' / ' + lbSlides.length : '';
  }

  if (lb) {
    lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__prev').addEventListener('click', function (e) {
      e.stopPropagation();
      lbGo(lbIndex - 1);
    });
    lb.querySelector('.lightbox__next').addEventListener('click', function (e) {
      e.stopPropagation();
      lbGo(lbIndex + 1);
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lbGo(lbIndex - 1);
      if (e.key === 'ArrowRight') lbGo(lbIndex + 1);
    });
  }

  /* ---------- image sliders ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.slider__slide'));
    if (!slides.length) return;

    var current = 0;
    var timer = null;
    var dotsWrap = slider.querySelector('.slider__dots');
    var prevBtn = slider.querySelector('.slider__prev');
    var nextBtn = slider.querySelector('.slider__next');
    var dots = [];

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'slider__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Image ' + (i + 1));
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        go(i);
        restart();
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsWrap) dotsWrap.style.display = 'none';
    }

    function go(n) {
      slides[current].classList.remove('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      current = (n + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      if (dots[current]) dots[current].classList.add('is-active');
    }

    function start() {
      if (slides.length <= 1) return;
      timer = setInterval(function () { go(current + 1); }, 4000);
    }

    function restart() {
      clearInterval(timer);
      start();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) { e.stopPropagation(); go(current - 1); restart(); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) { e.stopPropagation(); go(current + 1); restart(); });
    }

    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', function () { if (slides.length > 1) start(); });

    slider.addEventListener('click', function () { openLightbox(slides, current); });

    start();
  });

})();
