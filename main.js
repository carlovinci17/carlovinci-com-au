/* ============================================================
   Carlo Vinci — Portfolio interactions
   ============================================================ */
(() => {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- years of experience (auto-increments yearly) ---------- */
  const CAREER_START = 1999; // 27 years front-end as of 2027
  const AI_START = 2024; // 4 years AI-first as of 2027
  const thisYear = new Date().getFullYear();

  function setYears(selector, startYear) {
    const years = Math.max(1, thisYear - startYear);
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = String(years);
    });
  }

  setYears(".js-years", CAREER_START);
  setYears(".js-ai-years", AI_START);

  /* ---------- theme ---------- */
  const THEME_KEY = "cv-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }
  // expose so the Tweaks panel can drive the same source of truth
  window.cvSetTheme = applyTheme;
  window.cvGetTheme = () => root.getAttribute("data-theme") || "light";

  (function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {}
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  })();

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      applyTheme(window.cvGetTheme() === "dark" ? "light" : "dark");
      window.dispatchEvent(new CustomEvent("cv-theme-change"));
    });
  }

  /* ---------- page background: a layout perpetually reflowing ----------
     Replaces the particle constellation, which read as generic "tech" and
     said nothing about front-end work. This draws the 12-column grid the
     page itself is built on, with blocks easing between column spans like a
     responsive layout settling. Same budget as before: DPR capped at 2,
     ~30fps, cursor + scroll parallax, static under reduced motion. */
  (function initPageBg() {
    const canvas = document.getElementById("page-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const COLS = 12;
    const MAX_CONTENT = 1180; // matches --maxw so the grid aligns with content
    const MAX_SHIFT = 46;
    const SCROLL_FACTOR = 0.15;
    const GLOW_RADIUS = 260;
    const FRAME_MS = 33;

    let w = 0,
      h = 0,
      colW = 0,
      originX = 0;
    let blocks = [];
    let rect = canvas.getBoundingClientRect(); // cached; recomputed on resize
    const mouse = { x: -9999, y: -9999 };
    const parTarget = { x: 0, y: 0 };
    const parSmooth = { x: 0, y: 0 };

    const wrap = (v, max) => ((v % max) + max) % max;
    const randSpan = () => 2 + Math.floor(Math.random() * 5); // 2-6 columns

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = canvas.getBoundingClientRect();

      const contentW = Math.min(w * 0.92, MAX_CONTENT);
      colW = contentW / COLS;
      originX = (w - contentW) / 2;

      const count = Math.max(9, Math.round(h / 95));
      blocks = [];
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        const span = randSpan();
        blocks.push({
          col: Math.floor(Math.random() * (COLS - span + 1)),
          span,
          spanTarget: span,
          y: Math.random() * h,
          height: 26 + depth * 64,
          depth,
          accent: Math.random() < 0.22,
          wait: Math.random() * 150,
        });
      }
    }

    // ease toward the target span, dwell there, then pick a new one
    function settle(b) {
      b.span += (b.spanTarget - b.span) * 0.045;
      if (Math.abs(b.spanTarget - b.span) > 0.02) return;
      if (--b.wait > 0) return;
      b.spanTarget = randSpan();
      if (Math.random() < 0.35) {
        b.col = Math.floor(Math.random() * (COLS - b.spanTarget + 1));
      } else if (b.col + b.spanTarget > COLS) {
        b.col = Math.max(0, COLS - b.spanTarget);
      }
      b.wait = 70 + Math.random() * 200;
    }

    function roundRect(x, y, rw, rh, r) {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, rw, rh, r);
        return;
      }
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    }

    function draw() {
      if (!w || !h) return;
      const dark = window.cvGetTheme() === "dark";
      ctx.clearRect(0, 0, w, h);

      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (!prefersReducedMotion) {
        parSmooth.x += (parTarget.x - parSmooth.x) * 0.06;
        parSmooth.y += (parTarget.y - parSmooth.y) * 0.06;
      }

      // the column guides the blocks are snapping to
      ctx.lineWidth = 1;
      ctx.strokeStyle = dark
        ? "rgba(255,255,255,0.038)"
        : "rgba(30,36,56,0.05)";
      const guideShift = parSmooth.x * 10;
      for (let c = 0; c <= COLS; c++) {
        const gx = Math.round(originX + c * colW + guideShift) + 0.5;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }

      for (const b of blocks) {
        if (!prefersReducedMotion) settle(b);

        const x = originX + b.col * colW + parSmooth.x * b.depth * MAX_SHIFT;
        const y =
          wrap(
            b.y +
              parSmooth.y * b.depth * MAX_SHIFT -
              scrollY * b.depth * SCROLL_FACTOR,
            h + 220
          ) - 110;
        const bw = Math.max(colW * 0.6, b.span * colW - 10);

        const d = Math.hypot(x + bw / 2 - mouse.x, y + b.height / 2 - mouse.y);
        const glow = d < GLOW_RADIUS ? 1 - d / GLOW_RADIUS : 0;

        // stroked, not filled: filled slabs read as skeleton loaders, i.e. a
        // page still loading. Outlines read as the wireframe they're meant to.
        const base = b.accent ? (dark ? 0.14 : 0.12) : dark ? 0.06 : 0.055;
        const alpha = base + glow * (b.accent ? 0.22 : 0.12);
        ctx.strokeStyle = b.accent
          ? "rgba(42,91,215," + alpha + ")"
          : dark
            ? "rgba(255,255,255," + alpha + ")"
            : "rgba(30,36,56," + alpha + ")";
        ctx.lineWidth = 1;
        roundRect(x, y, bw, b.height, 6);
        ctx.stroke();
      }
    }

    let lastFrame = 0;
    function loop(now) {
      if (!lastFrame || now - lastFrame >= FRAME_MS) {
        draw();
        lastFrame = now;
      }
      if (!prefersReducedMotion) requestAnimationFrame(loop);
    }

    // canvas is pointer-events:none (it sits behind all page content), so
    // track the cursor at the window level instead of on the canvas itself.
    // rect is cached (not read here) to avoid forcing layout on every move.
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      parTarget.x = (mouse.x / rect.width) * 2 - 1;
      parTarget.y = (mouse.y / rect.height) * 2 - 1;
      if (prefersReducedMotion) draw();
    });
    document.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
      parTarget.x = 0;
      parTarget.y = 0;
      if (prefersReducedMotion) draw();
    });
    window.addEventListener(
      "scroll",
      () => {
        if (prefersReducedMotion) draw();
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      resize();
      if (prefersReducedMotion) draw();
    });
    // under reduced motion the loop isn't running, so repaint on theme change
    window.addEventListener("cv-theme-change", () => {
      if (prefersReducedMotion) draw();
    });

    resize();
    requestAnimationFrame(loop);
  })();

  /* ---------- nav stuck state ---------- */
  const nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- scroll-spy: highlight the current section's nav link ---------- */
  const spySections = ["about", "services", "work", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const spyLinks = document.querySelectorAll(
    '.nav__links a[href^="#"], .mobile-menu a[href^="#"]:not(.mobile-menu__cta)'
  );
  function setActiveLink(id) {
    spyLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }
  if (
    spySections.length &&
    spyLinks.length &&
    "IntersectionObserver" in window
  ) {
    // #about is the first section — you start inside it with no scroll yet,
    // so it may never cross the thin observation band below. Seed it as the
    // default, and keep forcing it near the very top where the band can also
    // miss it on the way back up.
    setActiveLink("about");
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY < 80) setActiveLink("about");
      },
      { passive: true }
    );

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveLink(en.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    spySections.forEach((section) => spy.observe(section));
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    const setMenu = (open) => {
      mobileMenu.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", () => {
      setMenu(!mobileMenu.classList.contains("open"));
    });
    mobileMenu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        mobileMenu.style.transition = "none";
        setMenu(false);
        setTimeout(() => {
          mobileMenu.style.transition = "";
        }, 50);
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  function revealEl(el) {
    el.classList.add("in");
  }
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            revealEl(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el, i) => {
      el.style.transitionDelay = Math.min((i % 4) * 60, 180) + "ms";
      io.observe(el);
    });
    // Safety net: never let content stay hidden if IO doesn't fire
    // (offscreen/embedded render contexts, prerender, etc.)
    const failsafe = () => {
      reveals.forEach((el) => {
        if (!el.classList.contains("in")) revealEl(el);
      });
    };
    window.addEventListener("load", () => setTimeout(failsafe, 900));
    setTimeout(failsafe, 2500);
  } else {
    reveals.forEach(revealEl);
  }

  /* ---------- lightbox ---------- */
  let lbSlides = [];
  let lbIndex = 0;
  let lbReturnFocus = null; // element to hand focus back to on close
  const lb = document.getElementById("lightbox");
  const lbImg = lb ? lb.querySelector(".lightbox__img") : null;
  const lbCounter = lb ? lb.querySelector(".lightbox__counter") : null;

  function openLightbox(slides, idx) {
    if (!lb) return;
    lbSlides = slides;
    lbIndex = idx;
    lbImg.src = slides[idx].src;
    lbImg.alt = slides[idx].alt;
    lbImg.style.opacity = "1";
    updateCounter();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lb.setAttribute("aria-modal", "true");
    document.body.style.overflow = "hidden";
    // a dialog that never takes focus leaves keyboard users tabbing the page
    // behind it; remember where they were so Escape can put them back.
    lbReturnFocus = document.activeElement;
    const close = lb.querySelector(".lightbox__close");
    if (close) close.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    lb.removeAttribute("aria-modal");
    document.body.style.overflow = "";
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }

  function lbGo(n) {
    if (!lbSlides.length) return;
    lbIndex = (n + lbSlides.length) % lbSlides.length;
    lbImg.style.opacity = "0";
    setTimeout(() => {
      lbImg.src = lbSlides[lbIndex].src;
      lbImg.alt = lbSlides[lbIndex].alt;
      lbImg.style.opacity = "1";
      updateCounter();
    }, 150);
  }

  function updateCounter() {
    if (!lbCounter) return;
    lbCounter.textContent =
      lbSlides.length > 1 ? lbIndex + 1 + " / " + lbSlides.length : "";
  }

  if (lb) {
    lb.querySelector(".lightbox__close").addEventListener(
      "click",
      closeLightbox
    );
    lb.querySelector(".lightbox__prev").addEventListener("click", (e) => {
      e.stopPropagation();
      lbGo(lbIndex - 1);
    });
    lb.querySelector(".lightbox__next").addEventListener("click", (e) => {
      e.stopPropagation();
      lbGo(lbIndex + 1);
    });
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lbGo(lbIndex - 1);
      if (e.key === "ArrowRight") lbGo(lbIndex + 1);
      if (e.key === "Tab") {
        // keep Tab inside the dialog while it's open
        const focusable = lb.querySelectorAll("button");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------- image sliders ---------- */
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const slides = Array.prototype.slice.call(
      slider.querySelectorAll(".slider__slide")
    );
    if (!slides.length) return;

    let current = 0;
    let timer = null;
    // WCAG 2.2.2: auto-advancing content needs a way to stop it. Taking manual
    // control — arrows, dots, or keyboard — parks the carousel for good.
    let userControlled = false;
    const dotsWrap = slider.querySelector(".slider__dots");
    const prevBtn = slider.querySelector(".slider__prev");
    const nextBtn = slider.querySelector(".slider__next");
    const dots = [];

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "slider__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Image " + (i + 1));
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        takeControl(i);
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      if (dotsWrap) dotsWrap.style.display = "none";
    }

    function go(n) {
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = (n + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].classList.add("is-active");
    }

    function start() {
      if (slides.length <= 1 || userControlled || prefersReducedMotion) return;
      clearInterval(timer);
      timer = setInterval(() => go(current + 1), 4000);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    // manual navigation doubles as the pause control
    function takeControl(n) {
      userControlled = true;
      stop();
      go(n);
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        takeControl(current - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        takeControl(current + 1);
      });
    }

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);

    slider.addEventListener("click", () => openLightbox(slides, current));

    // The slider is a plain div carrying a click handler, so without this the
    // project screenshots can't be opened by keyboard at all.
    slider.tabIndex = 0;
    slider.setAttribute("role", "button");
    slider.setAttribute("aria-label", "Open image viewer");
    slider.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(slides, current);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        takeControl(current - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        takeControl(current + 1);
      }
    });

    start();
  });
})();
