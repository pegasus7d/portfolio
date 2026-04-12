"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

export default function ParticleBg() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  // Pause particles when tab is hidden to save CPU
  const handleLoaded = useCallback(async (container?: Container) => {
    if (!container) return;

    const onVisibility = () => {
      if (document.hidden) {
        container.pause();
      } else {
        container.play();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    // Store for cleanup in unmount via container destroy
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: {
          value: 50,
          density: { enable: true, width: 1920, height: 1080 },
        },
        color: { value: "#3b82f6" },
        opacity: {
          value: { min: 0.1, max: 0.3 },
        },
        size: {
          value: { min: 1, max: 3 },
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none",
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 150,
          color: "#3b82f6",
          opacity: 0.08,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.2 } },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 -z-10"
      options={options}
      particlesLoaded={handleLoaded}
    />
  );
}
