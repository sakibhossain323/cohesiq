"use client";

import { useEffect } from "react";

export function LandingClient() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let countersDone = false;

    function animateCount(el: HTMLElement) {
      const target = parseFloat(el.dataset.count || "0");
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
      const dur = 1400;
      let start: number | null = null;
      function frame(ts: number) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(frame);
    }

    function inView(el: Element, frac = 0.9) {
      const r = el.getBoundingClientRect();
      const h = window.innerHeight;
      return r.top < h * frac && r.bottom > 0;
    }

    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .steps, .feature-visual"));
    const band = document.getElementById("stats");

    function tick() {
      for (let i = revealEls.length - 1; i >= 0; i--) {
        if (inView(revealEls[i], 0.92)) {
          revealEls[i].classList.add("is-visible");
          revealEls.splice(i, 1);
        }
      }
      if (!countersDone && band && inView(band, 0.85)) {
        countersDone = true;
        band.querySelectorAll<HTMLElement>("[data-count]").forEach(animateCount);
      }
    }

    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
    requestAnimationFrame(tick);
    const t = setTimeout(tick, 300);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      clearTimeout(t);
    };
  }, []);

  return null;
}
