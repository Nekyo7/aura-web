"use client";

import { useEffect } from "react";

export function RegisterPwa() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker != null) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("[AURA PWA] New content is available; please refresh.");
                  } else {
                    console.log("[AURA PWA] Content is cached for offline app shell.");
                  }
                }
              };
            }
          });
        })
        .catch((error) => {
          // If sw.js isn't generated in dev mode, fail silently
          if (process.env.NODE_ENV === "development") {
            console.debug("[AURA PWA] Service worker registration skipped in development:", error);
          } else {
            console.warn("[AURA PWA] Service worker registration failed:", error);
          }
        });
    }
  }, []);

  return null;
}

