/* ============================================================
   Carlo Vinci — Portfolio interactions
   ============================================================ */
(() => {
  "use strict";

  /* ---------- years of experience (auto-increments yearly) ---------- */
  const CAREER_START = 1999; // 27+ years as of 2026
  const years = Math.max(1, new Date().getFullYear() - CAREER_START);
  document.querySelectorAll(".js-years").forEach((el) => {
    el.textContent = String(years);
  });

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

  /* ---------- page background: full-page scroll + cursor parallax network ---------- */
  (function initPageBg() {
    const canvas = document.getElementById("page-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let points = [];
    let w = 0,
      h = 0;
    let rect = canvas.getBoundingClientRect(); // cached; only recomputed on resize
    const mouse = { x: -9999, y: -9999 };
    const parTarget = { x: 0, y: 0 };
    const parSmooth = { x: 0, y: 0 };
    const MAX_SHIFT = 46; // px, cursor-driven depth shift at full depth
    const SCROLL_FACTOR = 0.15; // scroll-driven depth shift, far layer ~= 0, near layer visibly drifts
    const MOUSE_RADIUS = 160;
    const LINK_DIST = 130;
    const FRAME_MS = 33; // cap the draw loop at ~30fps — ambient motion doesn't need 60fps

    function wrap(v, max) {
      return ((v % max) + max) % max;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR — avoid 3x overdraw on high-density phones
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rect = canvas.getBoundingClientRect();

      const count = Math.round((w * h) / 13000);
      points = [];
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: 0.4 + depth * 1.4,
          depth,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      if (!w || !h) return;
      const dark = window.cvGetTheme() === "dark";
      ctx.clearRect(0, 0, w, h);

      const starColor = dark ? [255, 255, 255] : [30, 36, 56];
      const lineColor = "42,91,215";
      const scrollY = window.scrollY || window.pageYOffset || 0;

      if (!reduceMotion) {
        parSmooth.x += (parTarget.x - parSmooth.x) * 0.06;
        parSmooth.y += (parTarget.y - parSmooth.y) * 0.06;
      }

      // near-mouse points only — avoids checking every point against every
      // other point just to find the handful actually close to the cursor.
      const near = [];
      for (const p of points) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
          p.tw += 0.02;
        }
        const scrollShift = scrollY * p.depth * SCROLL_FACTOR;
        p.px = p.x + parSmooth.x * p.depth * MAX_SHIFT;
        p.py = wrap(p.y + parSmooth.y * p.depth * MAX_SHIFT - scrollShift, h);

        const dm = Math.hypot(p.px - mouse.x, p.py - mouse.y);
        if (dm <= MOUSE_RADIUS) near.push({ p, dm });
      }

      for (let a = 0; a < near.length; a++) {
        const pa = near[a].p,
          da = near[a].dm;
        for (let b = a + 1; b < near.length; b++) {
          const pb = near[b].p,
            db = near[b].dm;
          const d = Math.hypot(pa.px - pb.px, pa.py - pb.py);
          if (d < LINK_DIST) {
            const alpha =
              (1 - d / LINK_DIST) *
              (1 - Math.max(da, db) / MOUSE_RADIUS) *
              (dark ? 0.7 : 0.5);
            ctx.strokeStyle = "rgba(" + lineColor + "," + alpha + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pa.px, pa.py);
            ctx.lineTo(pb.px, pb.py);
            ctx.stroke();
          }
        }
        const alphaM = (1 - da / MOUSE_RADIUS) * (dark ? 0.9 : 0.6);
        ctx.strokeStyle = "rgba(" + lineColor + "," + alphaM + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }

      for (const pk of points) {
        const twv = reduceMotion ? 0.6 : (Math.sin(pk.tw) + 1) / 2;
        const alphaS = dark ? 0.35 + twv * 0.55 : 0.25 + twv * 0.45;
        ctx.fillStyle = "rgba(" + starColor.join(",") + "," + alphaS + ")";
        ctx.beginPath();
        ctx.arc(pk.px, pk.py, pk.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let lastFrame = 0;
    function loop(now) {
      if (!lastFrame || now - lastFrame >= FRAME_MS) {
        draw();
        lastFrame = now;
      }
      if (!reduceMotion) requestAnimationFrame(loop);
    }

    // canvas is pointer-events:none (it sits behind all page content), so
    // track the cursor at the window level instead of on the canvas itself.
    // rect is cached (not read here) to avoid forcing layout on every move.
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      parTarget.x = (mouse.x / rect.width) * 2 - 1;
      parTarget.y = (mouse.y / rect.height) * 2 - 1;
      if (reduceMotion) draw();
    });
    document.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
      parTarget.x = 0;
      parTarget.y = 0;
      if (reduceMotion) draw();
    });
    window.addEventListener(
      "scroll",
      () => {
        if (reduceMotion) draw();
      },
      { passive: true }
    );
    window.addEventListener("resize", () => {
      resize();
      if (reduceMotion) draw();
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
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
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
        go(i);
        restart();
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
      if (slides.length <= 1) return;
      timer = setInterval(() => go(current + 1), 4000);
    }

    function restart() {
      clearInterval(timer);
      start();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        go(current - 1);
        restart();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        go(current + 1);
        restart();
      });
    }

    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", () => {
      if (slides.length > 1) start();
    });

    slider.addEventListener("click", () => openLightbox(slides, current));

    start();
  });
})();
