import type { CSSProperties, ReactNode } from 'react';
import { BorderBeam } from 'border-beam';
import type { BeamSettings } from './beam';

/**
 * Thin wrapper around border-beam.
 * - `active` fades the beam in/out (used for the Eva switch flash + processing run)
 * - `hueBase` rotates the whole palette to a custom hue via `--beam-hue-base`
 */
export function Beam({
  settings,
  children,
  fill = false,
}: {
  settings: BeamSettings;
  children: ReactNode;
  /** span the parent's width (so it wraps a full-width field) */
  fill?: boolean;
}) {
  const style = {
    '--beam-hue-base': `${settings.hueBase}deg`,
    ...(fill ? { display: 'block', width: '100%' } : null),
  } as CSSProperties;

  return (
    <BorderBeam
      size={settings.size}
      colorVariant={settings.colorVariant}
      theme={settings.theme}
      strength={settings.strength}
      duration={settings.duration}
      brightness={settings.brightness}
      saturation={settings.saturation}
      hueRange={settings.hueRange}
      active={settings.active}
      style={style}
    >
      {children}
    </BorderBeam>
  );
}
