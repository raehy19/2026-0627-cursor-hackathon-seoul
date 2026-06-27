"use client";

import dynamic from "next/dynamic";

const HeroSceneCanvas = dynamic(
  () => import("./HeroScene").then((m) => m.HeroSceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#12121c] via-background to-background"
        aria-hidden
      />
    ),
  },
);

/** Full-bleed Three.js backdrop for the landing screen. */
export function LandingHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(52vh,420px)] overflow-hidden">
      <div className="absolute inset-0 opacity-90">
        <HeroSceneCanvas />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
    </div>
  );
}
