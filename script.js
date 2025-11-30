document.addEventListener("DOMContentLoaded", () => {
  const topBar = document.querySelector(".top-bar");
  const progress = document.querySelector(".progress-bar");
  const badgeBar = document.querySelector(".badge-bar");
  const badgeWrap = document.querySelector(".badge-bar-wrap");
  const badgeTrigger = document.getElementById("badge-trigger") || badgeWrap;
  const revealTargets = document.querySelectorAll(
    "section:not(.hero), .feature-card, .lineup__card, .gallery__item, .screen-card"
  );

  revealTargets.forEach((el) => el.classList.add("section-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach((el) => observer.observe(el));

  const scrollLinks = [
    ...document.querySelectorAll('a[href^="#"]'),
    ...document.querySelectorAll("[data-scroll]"),
  ];

  scrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.dataset.scroll || link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    });
  });

  const handleScroll = () => {
    const scrollable =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const ratio = scrollable ? Math.min(1, window.scrollY / scrollable) : 0;

    if (topBar) {
      topBar.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (progress) {
      progress.style.transform = `scaleX(${ratio})`;
    }

  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  if (badgeBar && badgeWrap) {
    const setPlaceholder = () => {
      badgeWrap.style.height = `${badgeBar.offsetHeight}px`;
    };

    const updateBadgeBar = () => {
      const story = document.getElementById("product");
      const triggerTop = story?.getBoundingClientRect().top ?? Infinity;
      const triggerPoint = window.innerHeight * 1.1;
      const shouldFix = triggerTop <= triggerPoint;
      badgeBar.classList.toggle("is-fixed", shouldFix);
      badgeBar.style.pointerEvents = shouldFix ? "auto" : "none";
      setPlaceholder();
    };

    setPlaceholder();
    window.addEventListener("resize", setPlaceholder);
    window.addEventListener("scroll", updateBadgeBar, { passive: true });
    updateBadgeBar();
  }

  const interactive = document.querySelector(".glass-card");
  if (interactive) {
    let frame;
    const resetTilt = () => {
      interactive.style.transform = "rotateX(0) rotateY(0)";
    };

    interactive.addEventListener("mousemove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = interactive.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        interactive.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(
          x * 6
        ).toFixed(2)}deg)`;
      });
    });

    interactive.addEventListener("mouseleave", () => {
      cancelAnimationFrame(frame);
      resetTilt();
    });
  }

  const waitlistForms = document.querySelectorAll(".cta__form");
  const lang = document.body.dataset.lang === "de" ? "de" : "en";
  const labels =
    lang === "de"
      ? { sending: "Senden...", success: "Gesendet", error: "Nochmal" }
      : { sending: "Sending...", success: "Sent", error: "Retry" };

  waitlistForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      const messageInput = form.querySelector("input[name='message']");
      if (!button || !messageInput) return;

      const message = messageInput.value.trim();
      if (!message) {
        messageInput.focus();
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = labels.sending;

      try {
        const url = new URL("https://message.cluster.paluv.de");
        url.searchParams.set("message", message);
        await fetch(url.toString(), { method: "GET", mode: "no-cors" });
        button.textContent = labels.success;
        messageInput.value = "";
        messageInput.blur();
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1800);
      } catch (error) {
        button.textContent = labels.error;
        button.disabled = false;
      }
    });
  });

  const menuToggle = document.getElementById("menu-toggle");
  const menuOverlay = document.getElementById("menu-overlay");
  const closeMenu = document.querySelector(".menu-overlay__close");
  const menuLinks = document.querySelectorAll("[data-menu-link]");

  const setMenuState = (isOpen) => {
    if (!menuOverlay || !menuToggle) return;
    menuOverlay.classList.toggle("is-open", isOpen);
    menuOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.classList.toggle("no-scroll", isOpen);
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuOverlay?.classList.contains("is-open");
    setMenuState(!isOpen);
  });
  closeMenu?.addEventListener("click", () => setMenuState(false));
  menuOverlay?.addEventListener("click", (event) => {
    if (event.target === menuOverlay) setMenuState(false);
  });

  menuLinks.forEach((link) =>
    link.addEventListener("click", () => {
      setMenuState(false);
    })
  );

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });

  const langButtons = document.querySelectorAll(".lang-btn");
  const currentLang =
    document.body.dataset.lang ||
    (window.location.pathname.match(/\/(en|de)(\/|$)/) || [])[1] ||
    null;

  const getBasePath = () => {
    const match = window.location.pathname.match(/^(.*?)(\/(en|de))(\/|$)/);
    if (match && match[1] !== undefined) {
      return match[1].endsWith("/") ? match[1] : match[1] + "/";
    }
    return "/";
  };

  const redirectToLang = (lang) => {
    if (lang !== "en" && lang !== "de") return;
    localStorage.setItem("langChoice", lang);
    const base = getBasePath();
    const target = `${base}${lang}/`;
    if (!window.location.pathname.startsWith(target)) {
      window.location.href = target;
    } else {
      setMenuState(false);
    }
  };

  langButtons.forEach((btn) => {
    const target = btn.dataset.langTarget;
    if (target === currentLang) {
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
    }
    btn.addEventListener("click", () => redirectToLang(target));
  });

  const storyVideo = document.getElementById("story-video");
  if (storyVideo) {
    let direction = 1;
    let reverseFrame = null;
    const ensurePlay = () => storyVideo.play().catch(() => {});

    const startReverse = () => {
      cancelAnimationFrame(reverseFrame);
      storyVideo.pause();
      let prevTimestamp = null;
      const buffer = Math.max(0.1, Math.min(0.35, storyVideo.duration * 0.04));

      const step = (timestamp) => {
        if (prevTimestamp === null) prevTimestamp = timestamp;
        const deltaSeconds = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        storyVideo.currentTime = Math.max(buffer, storyVideo.currentTime - deltaSeconds);

        if (storyVideo.currentTime <= buffer + 0.01) {
          direction = 1;
          ensurePlay();
          return;
        }
        reverseFrame = requestAnimationFrame(step);
      };

      reverseFrame = requestAnimationFrame(step);
    };

    const handleForwardEnd = () => {
      if (!storyVideo.duration) return;
      const buffer = Math.max(0.1, Math.min(0.35, storyVideo.duration * 0.04));
      if (direction === 1 && storyVideo.currentTime >= storyVideo.duration - buffer) {
        direction = -1;
        startReverse();
      }
    };

    const initVideo = () => {
      const buffer = Math.max(0.1, Math.min(0.35, storyVideo.duration * 0.04 || 0.2));
      storyVideo.currentTime = buffer;
      direction = 1;
      ensurePlay();
    };

    storyVideo.addEventListener("timeupdate", handleForwardEnd);
    if (storyVideo.readyState >= 1) {
      initVideo();
    } else {
      storyVideo.addEventListener("loadedmetadata", initVideo);
    }
  }
});
