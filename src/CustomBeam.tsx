import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import './CustomBeam.css';

/**
 * Dependency-free border beam matching the Figma halo: a 1px gradient stroke plus a
 * 2px gradient border blurred behind it (unclipped bloom). The conic gradient is
 * rotated with a requestAnimationFrame loop (robust, no @property reliance).
 */
export function CustomBeam({
  active,
  colors,
  thickness,
  glow,
  duration,
  radius,
  spread = 360,
  strength = 1,
  blurOpacity = 0.32,
  brightness = 1,
  saturation = 1,
  children,
}: {
  active: boolean;
  colors: string[]; // any CSS colors — real custom colors
  thickness: number; // crisp stroke width (px)
  glow: number; // blur radius of the wider border behind (px)
  duration: number; // rotation period (s)
  radius: number; // corner radius (px), match the wrapped element
  spread?: number; // 360 = full-wrap gradient; less = traveling comet
  strength?: number; // stroke opacity (0–1)
  blurOpacity?: number; // opacity of the blurred border behind (Figma: 0.32)
  brightness?: number;
  saturation?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // rotate the gradient via rAF (reliable across browsers, no @property dependency)
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = 0;
    const period = Math.max(0.1, duration) * 1000;
    const loop = (t: number) => {
      if (!start) start = t;
      const deg = (((t - start) / period) * 360) % 360;
      ref.current?.style.setProperty('--nb-angle', `${deg.toFixed(2)}deg`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, duration]);

  const grad =
    spread >= 360
      ? `conic-gradient(from var(--nb-angle, 0deg), ${[...colors, colors[0]].join(', ')})`
      : (() => {
          const seg = spread / (colors.length + 1);
          const inner = colors.map((c, i) => `${c} ${(seg * (i + 1)).toFixed(1)}deg`).join(', ');
          return `conic-gradient(from var(--nb-angle, 0deg), transparent 0deg, ${inner}, transparent ${spread}deg, transparent 360deg)`;
        })();

  const style = {
    '--nb-grad': grad,
    '--nb-thickness': `${thickness}px`,
    '--nb-glow': `${glow}px`,
    '--nb-radius': `${radius}px`,
    '--nb-strength': strength,
    '--nb-blur-opacity': blurOpacity,
    '--nb-color-filter': `brightness(${brightness}) saturate(${saturation})`,
  } as CSSProperties;

  return (
    <div ref={ref} className={`nb ${active ? 'nb--active' : ''}`} style={style}>
      {/* blurred 2px border behind — blur is on the wrapper so the bloom isn't clipped */}
      <div className="nb__glow" aria-hidden>
        <span className="nb__glow-ring" />
      </div>
      <div className="nb__content">{children}</div>
      {/* crisp 1px gradient stroke on the edge */}
      <span className="nb__beam" aria-hidden />
    </div>
  );
}
