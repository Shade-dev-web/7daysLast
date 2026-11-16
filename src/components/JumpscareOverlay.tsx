import React from 'react';

export interface JumpscareState {
  active: boolean;
  kind: 'phantom' | 'window' | 'closet' | 'caught';
  caption: string;
}

interface JumpscareOverlayProps {
  jumpscare: JumpscareState;
  shaderFxEnabled: boolean;
  nightVision: boolean;
  darknessLevel?: number;
  graphicsModIntensity?: number;
  uvMode?: boolean;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({
  jumpscare,
  nightVision,
  darknessLevel = 0.65,
  graphicsModIntensity = 0.85,
  uvMode = false,
}) => {
  const darkAlpha = Math.min(0.88, Math.max(0, (darknessLevel - 0.35) * 0.65));
  const gfxVignette = Math.min(0.92, 0.35 + graphicsModIntensity * 0.48);

  return (
    <>
      {/* 1. Graphics Mod: Deep Abyssal Contrast & Atmospheric Vignette */}
      {graphicsModIntensity > 0.05 && (
        <div
          className="fixed inset-0 pointer-events-none z-11"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,${(darkAlpha * 0.25).toFixed(
              2
            )}) 30%, rgba(2,3,6,${gfxVignette.toFixed(2)}) 100%)`,
          }}
        />
      )}

      {/* 2. UV Blacklight Spectral Tint when UV Mode is active */}
      {uvMode && (
        <div
          className="fixed inset-0 pointer-events-none z-14"
          style={{
            background:
              'radial-gradient(circle at center, rgba(139,92,246,0.12) 0%, rgba(30,10,60,0.45) 100%)',
          }}
        />
      )}

      {/* 3. NightVision tint only when enabled in Mod Menu */}
      {nightVision && (
        <div
          className="fixed inset-0 pointer-events-none z-15"
          style={{
            background:
              'radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, rgba(0,20,10,0.45) 100%)',
          }}
        />
      )}

      {/* 4. Dark Psychological Horror Surge (No Cartoon Pop-up Face — Deep Abyssal Shadow & Crimson Veins) */}
      {jumpscare.active && (
        <div
          data-testid="jumpscare-overlay"
          className="fixed inset-0 z-45 pointer-events-none flex items-center justify-center overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at center, rgba(15,0,4,0.22) 18%, rgba(65,0,12,0.78) 68%, rgba(0,0,0,0.98) 100%)',
          }}
        >
          {/* Peripheral organic shadow veins & dark abyssal frame */}
          <svg
            viewBox="0 0 800 450"
            preserveAspectRatio="none"
            className="w-full h-full opacity-90"
          >
            <path
              d="M0 0 L240 0 Q120 75 75 180 Q35 280 0 450 Z"
              fill="#030102"
            />
            <path
              d="M800 0 L560 0 Q680 75 725 180 Q765 280 800 450 Z"
              fill="#030102"
            />
            {/* Subtle dark crimson peripheral fractures */}
            <path
              d="M0 40 Q95 90 155 150 M0 160 Q80 185 135 235 M0 340 Q110 300 170 275 M800 50 Q705 100 645 160 M800 190 Q710 205 655 250 M800 360 Q690 310 625 280"
              stroke="rgba(159,18,57,0.55)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </>
  );
};
