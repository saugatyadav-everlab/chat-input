export type BeamSize = 'sm' | 'md' | 'line' | 'pulse-inner' | 'pulse-outside';
export type BeamColor = 'colorful' | 'mono' | 'ocean' | 'sunset';
export type BeamTheme = 'dark' | 'light' | 'auto';
export interface BeamSettings {
  size: BeamSize;
  colorVariant: BeamColor;
  theme: BeamTheme;
  strength: number;
  duration: number;
  brightness: number;
  saturation: number;
  hueRange: number;
  /** Base hue rotation (deg) applied to the whole palette — our color control */
  hueBase: number;
  /** Whether the beam is currently shown (fades in/out) */
  active: boolean;
}
