import { gsap, ScrollTrigger, motion } from "@/utils/motion";

const FILM_PREVIEW_START = 0;
const FILM_PREVIEW_END = 4.5;

const FEATURED_WORKS = [
  { number: "01", title: "偷灵魂的人", type: "小说", href: "/fiction/soul-thief/" },
  { number: "02", title: "绘画", type: "绘画", href: "/artworks/" },
  { number: "03", title: "我和我的空壳", type: "影像", href: "/videos/" },
  { number: "04", title: "永不落幕", type: "游戏", href: "/games/endless/" }
] as const;

export const drawingAlignment = {
  sketch: {
    scale: 1.02,
    xPercent: 0,
    yPercent: 0
  },
  draft: {
    scale: 1.04,
    xPercent: 1.7,
    yPercent: 1.1
  },
  final: {
    scale: 1.07,
    xPercent: 3.8,
    yPercent: 1.4
  }
} as const;

interface PortalGeometry {
  x: number;
  y: number;
  radius: number;
}

const getRequired = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Featured experience target not found: ${selector}`);
  return element;
};

export const initFeaturedExperience = (root: HTMLElement) => {
  const stage = getRequired<HTMLElement>(root, "[data-featured-stage]");
  const novelScene = getRequired<HTMLElement>(root, '[data-featured-scene="novel"]');
  const drawingScene = getRequired<HTMLElement>(root, '[data-featured-scene="drawing"]');
  const filmScene = getRequired<HTMLElement>(root, '[data-featured-scene="film"]');
  const gameScene = getRequired<HTMLElement>(root, '[data-featured-scene="game"]');
  const novelWorld = getRequired<HTMLElement>(root, "[data-novel-world]");
  const novelScenes = Array.from(root.querySelectorAll<HTMLElement>("[data-novel-scene]"));
  const portalSentence = getRequired<HTMLElement>(root, "[data-portal-sentence]");
  const portalDot = getRequired<HTMLElement>(root, "[data-portal-dot]");
  const drawingCamera = getRequired<HTMLElement>(root, "[data-drawing-camera]");
  const sketchLayer = getRequired<HTMLElement>(root, '[data-drawing-layer="sketch"]');
  const draftLayer = getRequired<HTMLElement>(root, '[data-drawing-layer="draft"]');
  const finalLayer = getRequired<HTMLElement>(root, '[data-drawing-layer="final"]');
  const sketchImage = getRequired<HTMLImageElement>(sketchLayer, "img");
  const draftImage = getRequired<HTMLImageElement>(draftLayer, "img");
  const finalImage = getRequired<HTMLImageElement>(finalLayer, "img");
  const filmCopy = getRequired<HTMLElement>(root, "[data-film-copy]");
  const filmCountdown = getRequired<HTMLElement>(root, "[data-film-countdown]");
  const countdownSweep = getRequired<HTMLElement>(root, ".film-countdown__sweep");
  const countdownNumbers = Array.from(
    root.querySelectorAll<HTMLElement>("[data-countdown-number]")
  );
  const filmScreen = getRequired<HTMLElement>(root, "[data-film-screen]");
  const filmVideo = getRequired<HTMLVideoElement>(root, "[data-feature-film]");
  const gameCopy = getRequired<HTMLElement>(root, "[data-game-copy]");
  const gameCamera = getRequired<HTMLElement>(root, "[data-game-camera]");
  const flashlightCursor = getRequired<HTMLElement>(root, ".flashlight-cursor");
  const progress = getRequired<HTMLElement>(root, "[data-featured-progress]");
  const indexLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-feature-index-link]"));
  const mobileIndex = getRequired<HTMLAnchorElement>(root, "[data-feature-mobile-index]");
  const mobileCount = getRequired<HTMLElement>(root, "[data-feature-mobile-count]");
  const mobileTitle = getRequired<HTMLElement>(root, "[data-feature-mobile-title]");
  const stageHeading = getRequired<HTMLElement>(root, ".featured-stage__heading");
  const abortController = new AbortController();
  const { signal } = abortController;
  const media = gsap.matchMedia();
  let activeIndex = -1;
  let destroyed = false;
  let filmZoneActive = false;
  let gameZoneActive = false;
  let portalGeometry: PortalGeometry = { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 0 };

  const setActive = (index: number) => {
    const safeIndex = Math.max(0, Math.min(FEATURED_WORKS.length - 1, index));
    if (safeIndex === activeIndex) return;
    activeIndex = safeIndex;

    indexLinks.forEach((link, linkIndex) => {
      const active = linkIndex === safeIndex;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });

    const work = FEATURED_WORKS[safeIndex];
    mobileIndex.href = work.href;
    mobileIndex.setAttribute("aria-label", `打开${work.title}`);
    mobileCount.textContent = `${work.number} / 04`;
    mobileTitle.textContent = work.type;
    root.dataset.activeFeature = String(safeIndex);
  };

  const measurePortal = () => {
    const dotRect = portalDot.getBoundingClientRect();
    const x = dotRect.left + dotRect.width / 2;
    const y = dotRect.top + dotRect.height / 2;
    const farthestCorner = Math.max(
      Math.hypot(x, y),
      Math.hypot(window.innerWidth - x, y),
      Math.hypot(x, window.innerHeight - y),
      Math.hypot(window.innerWidth - x, window.innerHeight - y)
    );
    portalGeometry = {
      x,
      y,
      radius: farthestCorner * 1.06
    };
    root.style.setProperty("--portal-x", `${portalGeometry.x}px`);
    root.style.setProperty("--portal-y", `${portalGeometry.y}px`);
  };

  const pauseFilmPreview = (reset = true) => {
    filmZoneActive = false;
    filmVideo.pause();
    if (!reset || filmVideo.readyState < HTMLMediaElement.HAVE_METADATA) return;
    try {
      filmVideo.currentTime = FILM_PREVIEW_START;
    } catch {
      // A browser may reject seeking while the media element is still changing source.
    }
  };

  const playFilmPreview = () => {
    filmZoneActive = true;

    const start = () => {
      if (!filmZoneActive || destroyed) return;
      try {
        filmVideo.currentTime = FILM_PREVIEW_START;
      } catch {
        // Keep natural playback if an early seek is unavailable.
      }
      void filmVideo.play().catch(() => {
        // Muted playback normally succeeds; the poster remains a valid fallback.
      });
    };

    if (filmVideo.readyState >= HTMLMediaElement.HAVE_METADATA) start();
    else filmVideo.addEventListener("loadedmetadata", start, { once: true, signal });
  };

  const handleFilmTime = () => {
    if (filmZoneActive && filmVideo.currentTime >= FILM_PREVIEW_END) {
      filmVideo.pause();
    }
  };

  filmVideo.addEventListener("timeupdate", handleFilmTime, { signal });

  setActive(0);

  media.add(
    {
      desktop: "(min-width: 721px) and (prefers-reduced-motion: no-preference)",
      mobile: "(max-width: 720px) and (prefers-reduced-motion: no-preference)",
      reduced: "(prefers-reduced-motion: reduce)"
    },
    (context) => {
      const conditions = context.conditions as {
        desktop?: boolean;
        mobile?: boolean;
        reduced?: boolean;
      };

      if (conditions.reduced) {
        gsap.set(
          [novelScene, drawingScene, filmScene, gameScene, novelScenes, portalSentence],
          {
            clearProps: "all",
            autoAlpha: 1,
            clipPath: "none",
            filter: "none",
            transform: "none"
          }
        );
        return;
      }

      if (novelScenes.length !== 3) {
        throw new Error("Featured experience requires exactly three novel scenes.");
      }

      const scrollScreens = conditions.mobile ? 5.7 : 7.2;
      const maxCameraX = conditions.mobile ? 9 : 18;
      const maxCameraY = conditions.mobile ? 6 : 12;
      measurePortal();

      gsap.set(novelScene, { autoAlpha: 1 });
      gsap.set(novelScenes, { autoAlpha: 0, z: -140, filter: "blur(2px)" });
      gsap.set(novelScenes[0], { autoAlpha: 1, z: 0, filter: "blur(0px)" });
      gsap.set(portalSentence, { autoAlpha: 0, scale: 0.92, z: -80 });
      gsap.set(portalDot, { scale: 1, z: 0 });
      gsap.set(drawingScene, {
        autoAlpha: 0,
        clipPath: () =>
          `circle(0px at ${portalGeometry.x}px ${portalGeometry.y}px)`
      });
      gsap.set(drawingCamera, {
        scale: conditions.mobile ? 1.1 : 1.18,
        z: conditions.mobile ? -180 : -340
      });
      gsap.set(sketchImage, drawingAlignment.sketch);
      gsap.set(draftImage, drawingAlignment.draft);
      gsap.set(finalImage, drawingAlignment.final);
      gsap.set([draftLayer, finalLayer], { "--brush-cut": "104%" });
      gsap.set([filmScene, gameScene], { autoAlpha: 0 });
      gsap.set([filmCopy, filmCountdown, filmScreen, gameCopy, gameCamera], {
        autoAlpha: 0
      });
      gsap.set(countdownNumbers, {
        autoAlpha: 0,
        scale: 0.88,
        z: -80
      });
      gsap.set(countdownSweep, { rotation: -100 });
      gsap.set(gameCamera, {
        scale: conditions.mobile ? 1.045 : 1.065,
        x: 0,
        y: 0,
        "--flashlight-radius": conditions.mobile ? "24vmin" : "18vmin"
      });

      const cameraX = gsap.quickTo(gameCamera, "x", {
        duration: 0.68,
        ease: "power3.out"
      });
      const cameraY = gsap.quickTo(gameCamera, "y", {
        duration: 0.68,
        ease: "power3.out"
      });

      const setGameActive = (active: boolean) => {
        if (active === gameZoneActive) return;
        gameZoneActive = active;
        root.classList.toggle("is-game-active", active);
        document.documentElement.classList.toggle(
          "featured-game-cursor",
          active && Boolean(conditions.desktop)
        );
        if (!active) {
          cameraX(0);
          cameraY(0);
          flashlightCursor.style.opacity = "0";
        }
      };

      const handleGamePointer = (event: PointerEvent) => {
        if (!gameZoneActive) return;
        const rect = gameCamera.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const localY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        const normalizedX = localX / rect.width * 2 - 1;
        const normalizedY = localY / rect.height * 2 - 1;
        gameCamera.style.setProperty("--flashlight-x", `${localX / rect.width * 100}%`);
        gameCamera.style.setProperty("--flashlight-y", `${localY / rect.height * 100}%`);
        flashlightCursor.style.opacity = conditions.desktop ? "1" : "0";
        cameraX(normalizedX * maxCameraX);
        cameraY(normalizedY * maxCameraY);
      };

      gameCamera.addEventListener("pointermove", handleGamePointer, {
        passive: true,
        signal
      });
      gameCamera.addEventListener(
        "pointerleave",
        () => {
          if (!gameZoneActive) return;
          cameraX(0);
          cameraY(0);
          flashlightCursor.style.opacity = "0";
        },
        { passive: true, signal }
      );

      const timeline = gsap.timeline({
        defaults: { ease: motion.easeStandard },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${window.innerHeight * scrollScreens}`,
          pin: stage,
          pinSpacing: true,
          scrub: conditions.mobile ? 0.9 : 0.95,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress.style.transform = `scaleX(${self.progress})`;
            const sceneIndex =
              self.progress < 0.37
                ? 0
                : self.progress < 0.555
                  ? 1
                  : self.progress < 0.79
                    ? 2
                    : 3;
            setActive(sceneIndex);

            const shouldPlayFilm = self.progress >= 0.7 && self.progress < 0.79;
            if (shouldPlayFilm !== filmZoneActive) {
              if (shouldPlayFilm) playFilmPreview();
              else pauseFilmPreview();
            }
            setGameActive(self.progress >= 0.84 && self.progress < 0.96);
          }
        }
      });

      timeline
        .addLabel("novel-one:enter", 0)
        .fromTo(
          novelScenes[0],
          { autoAlpha: 0, z: -140, filter: "blur(2px)" },
          { autoAlpha: 1, z: 0, filter: "blur(0px)", duration: 2.8 },
          "novel-one:enter"
        )
        .addLabel("novel-one:settled", 2.8)
        .to(
          novelScenes[0],
          { autoAlpha: 1, z: 0, filter: "blur(0px)", duration: 4.2, ease: "none" },
          "novel-one:settled"
        )
        .addLabel("novel-one:exit", 7)
        .to(
          novelScenes[0],
          { autoAlpha: 0, z: 180, scale: 1.08, filter: "blur(2px)", duration: 2 },
          "novel-one:exit"
        )
        .addLabel("novel-two:enter", 9)
        .fromTo(
          novelScenes[1],
          { autoAlpha: 0, z: -160, scale: 0.94, filter: "blur(2px)" },
          { autoAlpha: 1, z: 0, scale: 1, filter: "blur(0px)", duration: 2.8 },
          "novel-two:enter"
        )
        .addLabel("novel-two:settled", 11.8)
        .to(
          novelScenes[1],
          { autoAlpha: 1, z: 0, scale: 1, filter: "blur(0px)", duration: 4.2, ease: "none" },
          "novel-two:settled"
        )
        .addLabel("novel-two:exit", 16)
        .to(
          novelScenes[1],
          { autoAlpha: 0, z: 190, scale: 1.08, filter: "blur(2px)", duration: 2 },
          "novel-two:exit"
        )
        .addLabel("novel-three:enter", 18)
        .fromTo(
          novelScenes[2],
          { autoAlpha: 0, z: -150, scale: 0.94, filter: "blur(2px)" },
          { autoAlpha: 1, z: 0, scale: 1, filter: "blur(0px)", duration: 2.8 },
          "novel-three:enter"
        )
        .addLabel("novel-three:settled", 20.8)
        .to(
          novelScenes[2],
          { autoAlpha: 1, z: 0, scale: 1, filter: "blur(0px)", duration: 3.2, ease: "none" },
          "novel-three:settled"
        )
        .addLabel("portal-copy:enter", 24)
        .to(
          novelScenes[2],
          { autoAlpha: 0, z: 150, filter: "blur(2px)", duration: 1.5 },
          "portal-copy:enter"
        )
        .fromTo(
          portalSentence,
          { autoAlpha: 0, scale: 0.92, z: -80, filter: "blur(2px)" },
          { autoAlpha: 1, scale: 1, z: 0, filter: "blur(0px)", duration: 1.5 },
          "portal-copy:enter"
        )
        .addLabel("portal-copy:settled", 25.5)
        .to(
          portalSentence,
          { autoAlpha: 1, scale: 1, z: 0, filter: "blur(0px)", duration: 3.5, ease: "none" },
          "portal-copy:settled"
        )
        .addLabel("portal:enter", 29)
        .set(drawingScene, { autoAlpha: 1 }, "portal:enter")
        .to(
          portalDot,
          {
            scale: conditions.mobile ? 8 : 13,
            z: 220,
            duration: 8,
            transformOrigin: "center"
          },
          "portal:enter"
        )
        .to(
          novelWorld,
          {
            autoAlpha: 0,
            scale: conditions.mobile ? 1.25 : 1.55,
            z: 420,
            filter: "blur(2px)",
            duration: 8
          },
          "portal:enter"
        )
        .fromTo(
          drawingScene,
          {
            clipPath: () =>
              `circle(0px at ${portalGeometry.x}px ${portalGeometry.y}px)`
          },
          {
            clipPath: () =>
              `circle(${portalGeometry.radius}px at ${portalGeometry.x}px ${portalGeometry.y}px)`,
            duration: 8,
            ease: motion.easeStandard
          },
          "portal:enter"
        )
        .to(
          drawingCamera,
          {
            scale: conditions.mobile ? 1.06 : 1.1,
            z: 0,
            duration: 8
          },
          "portal:enter"
        )
        .to(stageHeading, { autoAlpha: 0, duration: 2 }, 31)
        .addLabel("portal:settled", 37)
        .addLabel("drawing-sketch:enter", 37)
        .to(
          drawingCamera,
          {
            scale: conditions.mobile ? 1.055 : 1.1,
            x: 0,
            y: 0,
            z: 0,
            duration: 2.8
          },
          "drawing-sketch:enter"
        )
        .addLabel("drawing-sketch:settled", 39.8)
        .to(
          drawingCamera,
          {
            scale: conditions.mobile ? 1.045 : 1.085,
            duration: 1.2,
            ease: "none"
          },
          "drawing-sketch:settled"
        )
        .addLabel("drawing-draft:enter", 41)
        .to(
          draftLayer,
          {
            "--brush-cut": "-3%",
            duration: 6,
            ease: motion.easeStandard
          },
          "drawing-draft:enter"
        )
        .to(
          drawingCamera,
          {
            scale: conditions.mobile ? 1.035 : 1.065,
            x: conditions.mobile ? -4 : -12,
            y: conditions.mobile ? 2 : 6,
            duration: 6
          },
          "drawing-draft:enter"
        )
        .addLabel("drawing-draft:settled", 47)
        .to(
          draftLayer,
          { "--brush-cut": "-4%", duration: 1.5, ease: "none" },
          "drawing-draft:settled"
        )
        .addLabel("drawing-final:enter", 48.5)
        .to(
          finalLayer,
          {
            "--brush-cut": "-4%",
            duration: 5.7,
            ease: motion.easeStandard
          },
          "drawing-final:enter"
        )
        .to(
          drawingCamera,
          {
            scale: 1,
            x: 0,
            y: 0,
            duration: 5.7
          },
          "drawing-final:enter"
        )
        .addLabel("drawing-final:settled", 54.2)
        .to(
          [finalLayer, drawingCamera],
          { autoAlpha: 1, duration: 1.3, ease: "none" },
          "drawing-final:settled"
        )
        .addLabel("film-copy:enter", 55.5)
        .set(filmScene, { autoAlpha: 1 }, "film-copy:enter")
        .to(
          drawingScene,
          { autoAlpha: 0, scale: 0.96, filter: "brightness(0.34)", duration: 2.2 },
          "film-copy:enter"
        )
        .fromTo(
          filmCopy,
          { autoAlpha: 0, scale: 0.92, z: -90, filter: "blur(2px)" },
          { autoAlpha: 1, scale: 1, z: 0, filter: "blur(0px)", duration: 1.5 },
          "film-copy:enter"
        )
        .to(
          filmCopy,
          { autoAlpha: 1, scale: 1, duration: 2.2, ease: "none" },
          57
        )
        .to(
          filmCopy,
          { autoAlpha: 0, scale: 1.05, z: 90, filter: "blur(2px)", duration: 0.8 },
          59.2
        )
        .addLabel("countdown:enter", 60)
        .set(filmCountdown, { autoAlpha: 1 }, "countdown:enter")
        .fromTo(
          countdownSweep,
          { rotation: -100 },
          { rotation: 620, duration: 9.7, ease: "none" },
          "countdown:enter"
        )
        .fromTo(
          countdownNumbers[0],
          { autoAlpha: 0, scale: 0.88, z: -80 },
          { autoAlpha: 1, scale: 1, z: 0, duration: 0.8 },
          60
        )
        .to(countdownNumbers[0], { autoAlpha: 1, scale: 1.02, duration: 1.6, ease: "none" }, 60.8)
        .to(countdownNumbers[0], { autoAlpha: 0, scale: 1.12, z: 90, duration: 0.7 }, 62.4)
        .fromTo(
          countdownNumbers[1],
          { autoAlpha: 0, scale: 0.88, z: -80 },
          { autoAlpha: 1, scale: 1, z: 0, duration: 0.8 },
          63
        )
        .to(countdownNumbers[1], { autoAlpha: 1, scale: 1.02, duration: 1.6, ease: "none" }, 63.8)
        .to(countdownNumbers[1], { autoAlpha: 0, scale: 1.12, z: 90, duration: 0.7 }, 65.4)
        .fromTo(
          countdownNumbers[2],
          { autoAlpha: 0, scale: 0.88, z: -80 },
          { autoAlpha: 1, scale: 1, z: 0, duration: 0.8 },
          66
        )
        .to(countdownNumbers[2], { autoAlpha: 1, scale: 1.02, duration: 2.2, ease: "none" }, 66.8)
        .to(countdownNumbers[2], { autoAlpha: 0, scale: 1.12, z: 90, duration: 0.8 }, 69)
        .to(filmCountdown, { autoAlpha: 0, scale: 1.04, duration: 0.6 }, 69.4)
        .addLabel("film:enter", 70)
        .fromTo(
          filmScreen,
          { autoAlpha: 0, scale: 0.94, z: -160 },
          { autoAlpha: 1, scale: 1, z: 0, duration: 1.2 },
          "film:enter"
        )
        .to(filmScreen, { autoAlpha: 1, scale: 1, duration: 7, ease: "none" }, 71.2)
        .addLabel("game-copy:enter", 79)
        .set(gameScene, { autoAlpha: 1 }, "game-copy:enter")
        .to(filmScreen, { autoAlpha: 0, scale: 1.05, z: 120, duration: 1 }, "game-copy:enter")
        .to(filmScene, { autoAlpha: 0, duration: 1 }, "game-copy:enter")
        .fromTo(
          gameCopy,
          { autoAlpha: 0, scale: 0.94, z: -80, filter: "blur(2px)" },
          { autoAlpha: 1, scale: 1, z: 0, filter: "blur(0px)", duration: 1.3 },
          "game-copy:enter"
        )
        .to(gameCopy, { autoAlpha: 1, duration: 2.4, ease: "none" }, 80.3)
        .to(gameCopy, { autoAlpha: 0, scale: 1.05, z: 90, duration: 1.3 }, 82.7)
        .addLabel("game:enter", 84)
        .fromTo(
          gameCamera,
          {
            autoAlpha: 0,
            scale: conditions.mobile ? 1.02 : 1.04,
            filter: "brightness(0.55)",
            "--flashlight-radius": "2vmin"
          },
          {
            autoAlpha: 1,
            scale: conditions.mobile ? 1.045 : 1.065,
            filter: "brightness(1)",
            "--flashlight-radius": conditions.mobile ? "24vmin" : "18vmin",
            duration: 2.2
          },
          "game:enter"
        )
        .to(
          gameCamera,
          {
            autoAlpha: 1,
            scale: conditions.mobile ? 1.045 : 1.065,
            duration: 9.8,
            ease: "none"
          },
          86.2
        )
        .addLabel("game:exit", 96)
        .to(
          gameCamera,
          {
            autoAlpha: 0,
            scale: conditions.mobile ? 0.98 : 1,
            filter: "brightness(0.12)",
            "--flashlight-radius": "1vmin",
            duration: 4
          },
          "game:exit"
        )
        .to(gameScene, { autoAlpha: 0, duration: 2.5 }, "game:exit")
        .to({}, { duration: 0.01 }, 99.99);

      let refreshFrame = 0;
      const refresh = () => {
        window.cancelAnimationFrame(refreshFrame);
        refreshFrame = window.requestAnimationFrame(() => {
          measurePortal();
          ScrollTrigger.refresh();
        });
      };
      const resizeObserver = new ResizeObserver(refresh);
      resizeObserver.observe(stage);
      root.querySelectorAll("img").forEach((image) => {
        if (!image.complete) image.addEventListener("load", refresh, { once: true, signal });
      });
      window.addEventListener("resize", refresh, { passive: true, signal });
      const initialRefresh = window.setTimeout(refresh, 120);

      return () => {
        pauseFilmPreview();
        setGameActive(false);
        gsap.killTweensOf(gameCamera);
        window.clearTimeout(initialRefresh);
        window.cancelAnimationFrame(refreshFrame);
        resizeObserver.disconnect();
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    }
  );

  return () => {
    if (destroyed) return;
    destroyed = true;
    abortController.abort();
    media.revert();
    pauseFilmPreview();
    root.classList.remove("is-game-active");
    document.documentElement.classList.remove("featured-game-cursor");
  };
};
