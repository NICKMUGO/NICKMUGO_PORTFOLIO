(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Nairobi clock
  const clock = document.getElementById("clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
    const tick = () => (clock.textContent = fmt.format(new Date()));
    tick();
    setInterval(tick, 15000);
  }

  // Nav state on scroll
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Active nav link
  const links = [...document.querySelectorAll(".nav__links a")];
  const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  const secObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => secObs.observe(s));

  // Mobile menu
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && !menu.hidden && setMenu(false));

  // Marquee: duplicate content for a seamless loop
  const track = document.querySelector(".marquee__track");
  if (track) {
    const clone = track.innerHTML;
    track.insertAdjacentHTML("beforeend", clone);
    [...track.children].slice(track.children.length / 2).forEach((el) => el.setAttribute("aria-hidden", "true"));
  }

  // Count-up stats
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const fmt = (n) => n.toLocaleString("en-US") + suffix;
    if (reduceMotion) return (el.textContent = fmt(target));
    const dur = 1600;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal on scroll (stagger siblings)
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = reduceMotion ? "0ms" : `${Math.min(i, 6) * 80}ms`;
        el.classList.add("is-in");
        el.querySelectorAll("[data-count]").forEach(animateCount);
        revealObs.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  // Spotlight that follows the cursor on cards
  if (finePointer) {
    document.querySelectorAll(".spot").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // Magnetic buttons
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = el.classList.contains("email") ? 0.08 : 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  // Arcane Honor gallery: crossfade through gameplay stills
  document.querySelectorAll("[data-gallery]").forEach((g) => {
    const imgs = [...g.querySelectorAll("img")];
    const dots = [...g.querySelectorAll(".gallery__dots i")];
    if (imgs.length < 2 || reduceMotion) return;
    let i = 0, timer = null;
    const show = (n) => {
      imgs[i].classList.remove("is-active"); dots[i] && dots[i].classList.remove("is-active");
      i = n % imgs.length;
      imgs[i].classList.add("is-active"); dots[i] && dots[i].classList.add("is-active");
    };
    const start = () => { if (!timer) timer = setInterval(() => show(i + 1), 3800); };
    const stop = () => { clearInterval(timer); timer = null; };
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(g);
  });

  // Video modal (YouTube loads only when opened)
  const modal = document.getElementById("videoModal");
  if (modal && typeof modal.showModal === "function") {
    const frame = modal.querySelector(".video-modal__frame");
    const close = () => modal.close();
    document.querySelectorAll("[data-video]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.dataset.video;
        frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="Arcane Honor — Misfits254" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
        modal.showModal();
      })
    );
    modal.querySelector(".video-modal__close").addEventListener("click", close);
    modal.addEventListener("click", (e) => e.target === modal && close());
    modal.addEventListener("close", () => (frame.innerHTML = ""));
  } else {
    document.querySelectorAll("[data-video]").forEach((btn) =>
      btn.addEventListener("click", () => window.open(`https://www.youtube.com/watch?v=${btn.dataset.video}`, "_blank", "noopener"))
    );
  }

  // Copy email
  const copyBtn = document.getElementById("copyEmail");
  const hint = document.getElementById("copyHint");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        hint.textContent = "Copied to clipboard ✓";
      } catch {
        window.location.href = `mailto:${email}`;
        return;
      }
      setTimeout(() => (hint.textContent = "Click to copy"), 2200);
    });
  }
})();
