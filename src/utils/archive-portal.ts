type PortalKey = "novel" | "gallery" | "film" | "game";

export const initArchivePortal = (root: HTMLElement) => {
  const controller = new AbortController();
  const { signal } = controller;
  const links = Array.from(
    root.querySelectorAll<HTMLAnchorElement>("[data-archive-link]")
  );
  const previews = Array.from(
    root.querySelectorAll<HTMLElement>("[data-archive-preview]")
  );
  let pointerActive: PortalKey | null = null;
  let keyboardActive: PortalKey | null = null;

  const render = () => {
    const active = keyboardActive ?? pointerActive;
    if (active) root.dataset.portalActive = active;
    else delete root.dataset.portalActive;

    links.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.archiveLink === active);
    });
    previews.forEach((preview) => {
      preview.classList.toggle("is-active", preview.dataset.archivePreview === active);
    });
  };

  links.forEach((link) => {
    const key = link.dataset.archiveLink as PortalKey;

    link.addEventListener(
      "pointerenter",
      () => {
        pointerActive = key;
        render();
      },
      { passive: true, signal }
    );

    link.addEventListener(
      "focus",
      () => {
        keyboardActive = key;
        render();
      },
      { signal }
    );

    link.addEventListener(
      "blur",
      (event) => {
        const next = event.relatedTarget;
        if (next instanceof HTMLElement && next.matches("[data-archive-link]")) return;
        keyboardActive = null;
        render();
      },
      { signal }
    );
  });

  root.addEventListener(
    "pointerleave",
    () => {
      pointerActive = null;
      render();
    },
    { passive: true, signal }
  );

  return () => controller.abort();
};
