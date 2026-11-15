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
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({
  jumpscare,
  shaderFxEnabled,
  nightVision,
}) => {
  return (
    <>
      {/* Modern Screen-Space Horror Shader / Post-FX Layer (Grain, Scanlines, NightVision) */}
      {shaderFxEnabled && (
        <div
          className="fixed inset-0 pointer-events-none z-15"
          style={{
            backgroundImage: nightVision
              ? 'repeating-linear-gradient(0deg, rgba(16,185,129,0.06) 0px, rgba(16,185,129,0.06) 1px, transparent 1px, transparent 3px), radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, rgba(0,20,10,0.55) 100%)'
              : 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px)',
          }}
        />
      )}

      {/* Terrifying Jumpscare Apparition Overlay */}
      {jumpscare.active && (
        <div
          data-testid="jumpscare-overlay"
          className="fixed inset-0 z-45 pointer-events-none flex flex-col items-center justify-center bg-black/85 overflow-hidden"
        >
          {/* Red Chromatic Flash & Horror Silhouette SVG */}
          <div className="relative w-[min(78vw,540px)] h-[min(78vh,540px)] flex items-center justify-center animate-bounce">
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full drop-shadow-[0_0_35px_rgba(244,63,94,0.95)]"
            >
              {/* Distorted Abyssal Aura */}
              <circle cx="120" cy="120" r="105" fill="rgba(45,0,8,0.85)" />
              <circle cx="120" cy="115" r="78" fill="#090708" stroke="#881337" strokeWidth="2.5" />

              {/* Gaunt Elongated Skull & Acoustic Plates */}
              <path
                d="M65 85 C60 40, 180 40, 175 85 C185 130, 162 195, 120 215 C78 195, 55 130, 65 85 Z"
                fill="#181316"
                stroke="#F43F5E"
                strokeWidth="2"
              />
              {/* Torn Flesh Veins */}
              <path
                d="M75 70 L95 95 M165 70 L145 95 M80 145 L102 130 M160 145 L138 130"
                stroke="#9F1239"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Piercing Glowing Predator Eyes */}
              <ellipse cx="92" cy="102" rx="16" ry="11" fill="#4C0519" />
              <ellipse cx="148" cy="102" rx="16" ry="11" fill="#4C0519" />
              <circle cx="92" cy="102" r="7" fill="#F43F5E" />
              <circle cx="148" cy="102" r="7" fill="#F43F5E" />
              <circle cx="92" cy="102" r="2.8" fill="#FFF" />
              <circle cx="148" cy="102" r="2.8" fill="#FFF" />

              {/* Unhinged Screaming Jaw with Jagged Teeth */}
              <path
                d="M84 142 Q120 126 156 142 L148 196 Q120 212 92 196 Z"
                fill="#050203"
                stroke="#E11D48"
                strokeWidth="2"
              />
              {/* Upper & Lower Fangs */}
              <path
                d="M90 142 L96 162 L102 142 L108 165 L114 142 L120 168 L126 142 L132 165 L138 142 L144 162 L150 142"
                fill="#E2E8F0"
              />
              <path
                d="M94 194 L100 175 L106 194 L113 173 L120 194 L127 173 L134 194 L140 175 L146 194"
                fill="#CBD5E1"
              />

              {/* Reaching Claws */}
              <path
                d="M15 220 Q45 160 72 145 M25 232 Q58 178 82 165 M225 220 Q195 160 168 145 M215 232 Q182 178 158 165"
                stroke="#F43F5E"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
};
