import React from 'react';

export interface JumpscareState {
  active: boolean;
  kind: 'phantom' | 'blood_eye' | 'grab' | 'door_slam' | 'stalker' | string;
  caption?: string;
}

interface JumpscareOverlayProps {
  jumpscare: JumpscareState;
  shaderFxEnabled?: boolean;
  nightVision?: boolean;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({
  jumpscare,
  shaderFxEnabled,
  nightVision,
}) => {
  return (
    <>
      {shaderFxEnabled && (
        <div
          className="fixed inset-0 pointer-events-none z-15"
          style={{
            background: nightVision
              ? 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, rgba(4,47,46,0.32) 100%)'
              : 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.12) 4px)',
          }}
        />
      )}

      {jumpscare.active && (
        <div
          data-testid="jumpscare-overlay"
          className="fixed inset-0 z-[52] pointer-events-none overflow-hidden select-none flex flex-col items-center justify-center animate-pulse"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(165, 10, 24, 0.55) 0%, rgba(28, 2, 5, 0.94) 52%, rgba(0, 0, 0, 0.99) 100%)',
          }}
        >
          {/* Terrifying Anatomical Nightmare Monster Face Lunge */}
          <svg
            viewBox="0 0 400 400"
            className="w-[88vmin] h-[88vmin] max-w-[680px] max-h-[680px] drop-shadow-[0_0_65px_rgba(255,15,35,0.92)] scale-110 transition-transform duration-75"
          >
            {/* Torn Necrotic Cranium & Cheekbones */}
            <ellipse
              cx="200"
              cy="175"
              rx="118"
              ry="135"
              fill="#1e1513"
              stroke="#5a080c"
              strokeWidth="4"
            />
            <polygon points="88,165 55,210 112,240" fill="#2c1d19" />
            <polygon points="312,165 345,210 288,240" fill="#2c1d19" />

            {/* Necrotic Blood Veins */}
            <path
              d="M110,95 L145,135 L125,175 M290,95 L255,135 L275,175 M200,55 L192,115 L210,150"
              stroke="#880812"
              strokeWidth="3.5"
              fill="none"
            />

            {/* Deep Sunken Eye Sockets + Piercing Crimson Pupils */}
            <ellipse
              cx="146"
              cy="156"
              rx="34"
              ry="38"
              fill="#030000"
              stroke="#3d070a"
              strokeWidth="3"
            />
            <ellipse
              cx="254"
              cy="156"
              rx="34"
              ry="38"
              fill="#030000"
              stroke="#3d070a"
              strokeWidth="3"
            />
            <circle cx="146" cy="156" r="13" fill="#ff111e" />
            <circle cx="254" cy="156" r="13" fill="#ff111e" />
            <circle cx="144" cy="153" r="4.5" fill="#ffffff" />
            <circle cx="252" cy="153" r="4.5" fill="#ffffff" />

            {/* Nasal Bone Cavity */}
            <polygon
              points="200,170 183,212 217,212"
              fill="#050000"
              stroke="#45080b"
              strokeWidth="2"
            />

            {/* Unhinged Gaping Maw */}
            <ellipse
              cx="200"
              cy="272"
              rx="86"
              ry="68"
              fill="#040000"
              stroke="#7f0912"
              strokeWidth="5"
            />
            <ellipse cx="200" cy="278" rx="56" ry="42" fill="#520409" />

            {/* Upper Razor Fangs */}
            {[-66, -48, -32, -16, 0, 16, 32, 48, 66].map((dx, idx) => (
              <polygon
                key={`uf-${idx}`}
                points={`${200 + dx - 7},224 ${200 + dx + 7},224 ${200 + dx},${264 + (idx % 2) * 14}`}
                fill="#e5dac3"
                stroke="#5c080b"
                strokeWidth="1.2"
              />
            ))}

            {/* Lower Split Mandible Fangs */}
            {[-60, -44, -28, -12, 12, 28, 44, 60].map((dx, idx) => (
              <polygon
                key={`lf-${idx}`}
                points={`${200 + dx - 6},322 ${200 + dx + 6},322 ${200 + dx},${284 - (idx % 2) * 12}`}
                fill="#dfd1b4"
                stroke="#5c080b"
                strokeWidth="1.2"
              />
            ))}
          </svg>

          {jumpscare.caption && (
            <div className="mt-2 px-5 py-1.5 rounded-lg bg-black/85 border border-rose-500/60 font-['Unbounded'] text-sm sm:text-base font-extrabold tracking-widest text-rose-400 uppercase shadow-2xl">
              {jumpscare.caption}
            </div>
          )}

          {/* Peripheral claw slash marks */}
          <div
            className="absolute inset-0 opacity-75"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-32deg, transparent 0px, transparent 58px, rgba(225, 29, 72, 0.28) 59px, rgba(0, 0, 0, 0.88) 64px, transparent 68px)',
            }}
          />
        </div>
      )}
    </>
  );
};
