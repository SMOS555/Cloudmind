import React from 'react';
import { BAT_LOGO_PATH } from './batLogoPath';

/**
 * Exact Christopher Nolan Dark Knight Bat Emblem
 * Traced directly from user-uploaded brushed titanium asset (721x250)
 * Symmetrical, razor-sharp 3:1 aspect ratio
 */
export default function BatLogo({
  className = 'w-8 h-auto',
  glow = false,
  variant = 'vector', /* 'vector' | 'metallic' */
  style = {},
  ...props
}) {
  if (variant === 'metallic') {
    return (
      <img
        src="/bat-logo-metallic.png"
        alt="Bat Emblem"
        className={`inline-block aspect-[546/183] object-contain ${className} ${
          glow ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]' : ''
        }`}
        style={style}
        {...props}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 1000 330"
      preserveAspectRatio="xMidYMid meet"
      className={`inline-block aspect-[1000/330] overflow-visible ${className} ${
        glow ? 'drop-shadow-[0_0_16px_rgba(255,255,255,0.75)]' : ''
      }`}
      style={{
        shapeRendering: 'geometricPrecision',
        flexShrink: 0,
        ...style,
      }}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d={BAT_LOGO_PATH} />
    </svg>
  );
}
