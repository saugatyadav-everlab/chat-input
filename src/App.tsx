import { useEffect, useRef, useState } from 'react';
import type { Transition } from 'motion/react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

import { Beam } from './BeamLayer';
import { CustomBeam } from './CustomBeam';
import ChatInput, {
  type FieldState,
  type Recipient,
  type LineType,
} from './components/ChatInput';
import { ChipGroup } from './components/Chips';
import type { BeamSettings, BeamColor } from './beam';
import './App.css';

const TYPES: readonly LineType[] = ['Multi line', 'Single line'];

export function useSystemDark() {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

export default function App() {
  const [type, setType] = useState<LineType>('Multi line');
  const [recipient, setRecipient] = useState<Recipient>('Copilot');

  // ---- live interaction → derived field state ----
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [processing, setProcessing] = useState(false);

  const state: FieldState = processing
    ? 'Processing'
    : value.trim()
    ? 'Filled'
    : focused
    ? 'Active'
    : 'Rest';

  const isEva = recipient === 'Copilot';

  const handleSubmit = () => {
    if (processing) {
      setProcessing(false); // stop
      return;
    }
    setProcessing(true);
    setValue(''); // clear old text immediately — it should not linger while processing
  };

  // The page shows both themes at once (dark top half, light bottom half), so the
  // root (header/panel) is fixed dark and each half scopes its own theme.
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  // press "r" to toggle recipient (to preview the switch animation) — ignored while
  // typing in a field or with a modifier held (so Cmd/Ctrl+R still reloads).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      setRecipient((r) => (r === 'Copilot' ? 'Care team' : 'Copilot'));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ---- beam controls (DialKit) — beam is always container-level now ----
  const beam = useDialKit('Beam', {
    preview: false, // force the beam visible while tuning
    colors: {
      type: 'select',
      options: [
        { value: 'ocean', label: '2-tone · ocean' },
        { value: 'mono', label: 'Mono · grayscale' },
        { value: 'sunset', label: 'Warm · sunset' },
        { value: 'colorful', label: 'Spectrum · colorful' },
      ],
    },
    beamTheme: {
      type: 'select',
      options: [
        { value: 'auto', label: 'auto' },
        { value: 'dark', label: 'dark' },
        { value: 'light', label: 'light' },
      ],
    },
    hueShift: [156, 0, 360, 1],
    strength: [1, 0, 1, 0.05],
    duration: [1.96, 0.4, 8, 0.02],
    brightness: [1.05, 0.4, 3, 0.05],
    saturation: [0.8, 0, 3, 0.05],
    hueRange: [30, 0, 180, 1],
    // timing
    evaSignalSec: [1.8, 0.3, 6, 0.1],
    processingSec: [2, 0.3, 8, 0.1], // duration of ONE processing beam loop
    processingLoops: [4, 1, 12, 1], // processing runs this many loops, then resets
    // recipient-button animation springs (same spring editor as each other)
    resizeTransition: { type: 'spring', bounce: 0.25, visualDuration: 0.3 }, // button width resize on switch
    resizeDelay: [0, 0, 1, 0.01], // delay (s) before the width resize starts
    rollTransition: { type: 'spring', bounce: 0.15, visualDuration: 0.45 }, // vertical word roll
    // roll animation properties
    rollBlur: [4, 0, 20, 0.5], // blur (px) applied to the entering/leaving word
    rollTravel: [20, 0, 200, 5], // how far the word travels vertically (%)
    rollFade: [0, 0, 1, 0.05], // opacity the word fades from/to (0 = full fade)
  });

  // read timings via refs so changing them doesn't re-fire the effects
  const evaSecRef = useRef(beam.evaSignalSec);
  const procSecRef = useRef(beam.processingSec);
  const procLoopsRef = useRef(beam.processingLoops);
  evaSecRef.current = beam.evaSignalSec;
  procSecRef.current = beam.processingSec;
  procLoopsRef.current = beam.processingLoops;

  // Eva switch flash — a temporary signal that fades on its own
  const [evaSignal, setEvaSignal] = useState(false);
  const evaTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(evaTimer.current);
    if (recipient === 'Copilot') {
      setEvaSignal(true);
      evaTimer.current = window.setTimeout(
        () => setEvaSignal(false),
        evaSecRef.current * 1000
      );
    } else {
      setEvaSignal(false);
    }
    return () => window.clearTimeout(evaTimer.current);
  }, [recipient]);

  // Processing runs until "done", then the input resets to Rest
  const procTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(procTimer.current);
    if (processing) {
      // stay for N loops of a single-loop-duration animation, then reset
      procTimer.current = window.setTimeout(() => {
        setProcessing(false);
        setValue('');
      }, procLoopsRef.current * procSecRef.current * 1000);
    }
    return () => window.clearTimeout(procTimer.current);
  }, [processing]);

  // Beam shows: manual preview, while processing an Eva message, or the Eva switch flash.
  // Both use the full-border look so they show the full selected palette.
  const showProcessing = (processing && isEva) || beam.preview;
  const showSwitch = evaSignal && !showProcessing;
  const beamShown = showProcessing || showSwitch;

  // per-theme beam settings — light washes out on white, so bump brightness / drop
  // saturation for it (and set border-beam's own theme mode explicitly).
  const beamFor = (t: 'dark' | 'light'): BeamSettings => ({
    size: 'md',
    colorVariant: beam.colors as BeamColor,
    theme: t,
    strength: beam.strength,
    // during processing one beam loop lasts `processingSec` (so N loops fit the window)
    duration: showProcessing ? beam.processingSec : beam.duration,
    brightness: t === 'light' ? 1.7 : beam.brightness,
    saturation: t === 'light' ? 0.7 : beam.saturation,
    hueRange: beam.hueRange,
    hueBase: beam.hueShift,
    active: beamShown,
  });

  // second field: the dependency-free reconstruction, triggered by the same events
  const cb = useDialKit('Custom Beam', {
    color1: { type: 'color', default: '#E1915F' },
    color2: { type: 'color', default: '#FFCBAB' },
    color3: { type: 'color', default: '#C4B8FF' },
    color4: { type: 'color', default: '#F37938' },
    spread: [360, 20, 360, 5],
    thickness: [1, 0.5, 8, 0.5],
    strokeOpacity: [0.72, 0, 1, 0.02],
    glow: [6, 0, 60, 1],
    blurOpacity: [0.35, 0, 1, 0.02],
    duration: [1, 0.4, 12, 0.1],
    radius: [24, 0, 40, 1],
  });

  const fieldProps = {
    state,
    recipient,
    onRecipientChange: setRecipient,
    type,
    value,
    onValueChange: setValue,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onSubmit: handleSubmit,
    resizeTransition: { ...(beam.resizeTransition as object), delay: beam.resizeDelay } as unknown as Transition,
    rollTransition: beam.rollTransition as unknown as Transition,
    roll: { blur: beam.rollBlur, travel: beam.rollTravel, fade: beam.rollFade },
  };

  // both beam versions (border-beam + reconstruction) for a given theme, 40px apart
  const renderPair = (t: 'dark' | 'light') => (
    <div className="half" data-theme={t}>
      {/* border-beam version */}
      <Beam settings={beamFor(t)}>
        <ChatInput {...fieldProps} />
      </Beam>

      {/* dependency-free reconstruction — lit by the same triggers */}
      <CustomBeam
        active={beamShown}
        colors={[cb.color1, cb.color2, cb.color3, cb.color4]}
        spread={cb.spread}
        thickness={cb.thickness}
        strength={cb.strokeOpacity}
        glow={cb.glow}
        blurOpacity={cb.blurOpacity}
        duration={cb.duration}
        radius={type === 'Multi line' ? cb.radius : 9999}
        brightness={t === 'light' ? 1.7 : 1}
        saturation={t === 'light' ? 0.7 : 1}
      >
        <ChatInput {...fieldProps} />
      </CustomBeam>
    </div>
  );

  return (
    <div className="stage">
      <header className="chips-bar">
        <ChipGroup label="Type" options={TYPES} value={type} onChange={setType} />
      </header>

      <main className="stage__split">
        {renderPair('dark')}
        {renderPair('light')}
      </main>

      <DialRoot theme="dark" position="bottom-right" defaultOpen mode="popover" />
    </div>
  );
}
