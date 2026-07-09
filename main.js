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
