"use client";

import { HeroSceneCanvas } from "@/components/hero/HeroScene";

/** Square frame for logo export. Run `npm run capture-logo` or visit /logo-capture. */
export default function LogoCapturePage() {
  return (
    <div
      id="logo-capture-frame"
      className="relative shrink-0 overflow-hidden bg-[#0b0b12]"
      style={{ width: 1024, height: 1024 }}
    >
      <HeroSceneCanvas mode="logo" />
    </div>
  );
}
