import React from 'react';

export const WeaveDefs: React.FC = () => {
  return (
    <defs>
      {/* 1. Empty warp and weft texture: faint crossing hairlines */}
      <pattern
        id="warp-weft-empty"
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 8 0 L 8 16 M 0 8 L 16 8"
          stroke="var(--rule)"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
      </pattern>

      {/* 2. Plain weave texture: subtle over-under interlacing */}
      <pattern
        id="plain-weave"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <rect width="4" height="4" fill="currentColor" fillOpacity="0.08" />
        <rect x="4" y="4" width="4" height="4" fill="currentColor" fillOpacity="0.08" />
        <path
          d="M 4 0 L 4 8 M 0 4 L 8 4"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeOpacity="0.15"
        />
      </pattern>

      {/* 3. Generic Twill Clash pattern: 45-degree diagonal interlacing */}
      <pattern
        id="twill-clash"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="10" stroke="var(--clash)" strokeWidth="3" />
        <line x1="5" y1="0" x2="5" y2="10" stroke="var(--ink)" strokeWidth="2" strokeOpacity="0.8" />
      </pattern>
    </defs>
  );
};
