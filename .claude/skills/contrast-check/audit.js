/* Text-contrast audit, injected into a throwaway copy of index.html.
 *
 * Walks every element that renders its own text, works out the colour actually
 * behind that text, and reports the WCAG 2.1 ratio. Results land in
 * <script id="contrast-report"> for --dump-dom to collect.
 *
 * Why canvas compositing rather than parsing colour strings: the tokens are
 * oklch() and color-mix(), surfaces stack translucent layers, and
 * getComputedStyle returns whichever serialisation Chrome prefers (it hands
 * back oklab() for a color-mix, for instance). Painting the stack and reading
 * the pixel sidesteps all of it.
 *
 * Two things have to settle before any measurement is meaningful:
 *   1. Theme colours transition over 0.4s. Read too early and getComputedStyle
 *      returns the *previous* theme's colour — which is how this first reported
 *      light-theme text sitting on the dark background.
 *   2. .reveal starts at opacity 0 and only gains .in from an IntersectionObserver,
 *      so most of the page reads as hidden until it fires.
 * Killing transitions and forcing .in handles both without depending on timing.
 */
(function () {
  var TEXT_FLOOR = 4.5; // WCAG AA, normal text
  var LARGE_FLOOR = 3.0; // >=24px, or >=18.66px at weight >=700
  var MAX_TEXT = 46;

  // Snap every in-flight transition to its end state. Must go in immediately —
  // the theme pin above has already started a 0.4s background-color transition.
  var kill = document.createElement("style");
  kill.textContent =
    "*,*::before,*::after{transition:none !important;animation-duration:0s !important}";
  document.head.appendChild(kill);

  var probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  var ctx = probe.getContext("2d", { willReadFrequently: true });

  /* Paint `layers` (furthest back first) over `base`; return the visible RGB.
     Canvas does the source-over alpha maths, so translucent surfaces stack the
     way they do on screen. */
  function flatten(base, layers) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1, 1);
    for (var i = 0; i < layers.length; i++) {
      ctx.fillStyle = layers[i];
      ctx.fillRect(0, 0, 1, 1);
    }
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }

  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function ratio(a, b) {
    var la = luminance(a),
      lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function isTransparent(color) {
    return (
      !color ||
      color === "transparent" ||
      /^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(color.replace(/\s+/g, " "))
    );
  }

  /* The page background is the fixed .site-bg canvas layer — <body> is
     deliberately transparent so the animated canvas shows through. */
  function pageBackground() {
    var el = document.querySelector(".site-bg");
    var c = el && getComputedStyle(el).backgroundColor;
    if (!isTransparent(c)) return c;
    c = getComputedStyle(document.documentElement).backgroundColor;
    return isTransparent(c) ? "#ffffff" : c;
  }

  function shortSelector(el) {
    var parts = [];
    for (
      var n = el;
      n && n.nodeType === 1 && parts.length < 3;
      n = n.parentElement
    ) {
      var s = n.tagName.toLowerCase();
      if (n.id) {
        parts.unshift(s + "#" + n.id);
        break;
      }
      if (n.classList.length) {
        s += "." + Array.prototype.join.call(n.classList, ".");
      }
      parts.unshift(s);
    }
    return parts.join(" > ");
  }

  function ownText(el) {
    var out = "";
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3) out += el.childNodes[i].nodeValue;
    }
    return out.trim().replace(/\s+/g, " ");
  }

  function hidden(el, cs) {
    if (cs.visibility === "hidden" || cs.display === "none") return true;
    if (parseFloat(cs.opacity) === 0) return true;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return true;
    // aria-hidden subtrees (the duplicated marquee half) are read by no one
    return !!el.closest('[aria-hidden="true"]');
  }

  function run() {
    // Don't wait on the IntersectionObserver — reveal everything ourselves.
    var reveals = document.querySelectorAll(".reveal");
    for (var r = 0; r < reveals.length; r++) reveals[r].classList.add("in");

    var report = {
      checked: 0,
      min: Infinity,
      fail: [],
      approx: [],
      unmeasurable: [],
    };
    var base = pageBackground();
    var els = document.querySelectorAll("body *");

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var text = ownText(el);
      if (!text) continue;

      var cs = getComputedStyle(el);
      if (hidden(el, cs)) continue;

      // Collect background layers from this element out to the root.
      var layers = [];
      var blurred = false;
      var unknown = null;
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
        var ncs = n === el ? cs : getComputedStyle(n);

        if (ncs.backgroundImage && ncs.backgroundImage !== "none") {
          // A gradient has no single colour, so the stack can't be flattened.
          unknown = "background-image";
          break;
        }
        // backdrop-filter resamples what's behind it. A blur of a broadly flat
        // backdrop keeps its average colour, so the flattened stack is still a
        // fair estimate — but it is an estimate, and gets reported as one.
        if (
          (ncs.backdropFilter && ncs.backdropFilter !== "none") ||
          (ncs.webkitBackdropFilter && ncs.webkitBackdropFilter !== "none")
        ) {
          blurred = true;
        }
        if (!isTransparent(ncs.backgroundColor))
          layers.unshift(ncs.backgroundColor);
      }

      var sample =
        text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + "…" : text;
      var px = parseFloat(cs.fontSize);
      var weight = parseInt(cs.fontWeight, 10) || 400;
      var large = px >= 24 || (px >= 18.66 && weight >= 700);

      if (unknown) {
        report.unmeasurable.push({
          sel: shortSelector(el),
          text: sample,
          why: unknown,
        });
        continue;
      }

      var bg = flatten(base, layers);
      // Text colour can itself be translucent — composite it over its backdrop.
      var fg = flatten("rgb(" + bg.join(",") + ")", [cs.color]);

      var value = Math.round(ratio(fg, bg) * 100) / 100;
      report.checked++;
      if (value < report.min) report.min = value;

      var need = large ? LARGE_FLOOR : TEXT_FLOOR;
      if (value < need) {
        (blurred ? report.approx : report.fail).push({
          sel: shortSelector(el),
          text: sample,
          ratio: value.toFixed(2),
          need: need.toFixed(1),
          fg: "rgb(" + fg.join(" ") + ")",
          bg: "rgb(" + bg.join(" ") + ")",
          size: Math.round(px) + "px/" + weight + (large ? " large" : ""),
        });
      }
    }

    report.min = report.min === Infinity ? null : report.min.toFixed(2);
    var byRatio = function (a, b) {
      return a.ratio - b.ratio;
    };
    report.fail.sort(byRatio);
    report.approx.sort(byRatio);

    var out = document.createElement("script");
    out.type = "application/json";
    out.id = "contrast-report";
    out.textContent = JSON.stringify(report);
    document.body.appendChild(out);
  }

  // Wait for load so fonts and layout have settled; the extra tick lets the
  // forced style recalc land before anything is measured.
  if (document.readyState === "complete") setTimeout(run, 50);
  else
    window.addEventListener("load", function () {
      setTimeout(run, 50);
    });
})();
