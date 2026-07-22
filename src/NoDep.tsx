import { useEffect, useState } from 'react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

import { useSystemDark } from './App';
import { CustomBeam } from './CustomBeam';
import ChatInput, {
  type FieldState,
  type Recipient,
  type LineType,
} from './components/ChatInput';
import { ChipGroup } from './components/Chips';
import './App.css';

const TYPES: readonly LineType[] = ['Multi line', 'Single line'];
type Appearance = 'system' | 'light' | 'dark';

export default function NoDep() {
  const [type, setType] = useState<LineType>('Multi line');
  const [recipient, setRecipient] = useState<Recipient>('Copilot');
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

  const handleSubmit = () => {
    if (processing) return setProcessing(false);
    setProcessing(true);
    setValue('');
  };

  const [appearance, setAppearance] = useState<Appearance>('system');
  const systemDark = useSystemDark();
  const resolvedTheme: 'light' | 'dark' =
    appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance;
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  // reconstructed beam — arbitrary custom colors, no border-beam dependency
  const beam = useDialKit('Custom Beam', {
    active: true,
    color1: { type: 'color', default: '#E1915F' },
    color2: { type: 'color', default: '#FFCBAB' },
    color3: { type: 'color', default: '#C4B8FF' },
    color4: { type: 'color', default: '#F37938' },
    spread: [360, 20, 360, 5], // 360 = full-wrap gradient; lower = traveling comet
    thickness: [1, 0.5, 8, 0.5], // crisp stroke width (Figma: 1px)
    strokeOpacity: [0.72, 0, 1, 0.02], // opacity of the 1px border
    glow: [6, 0, 60, 1], // blur radius of the wider border behind (Figma: 6px)
    blurOpacity: [0.35, 0, 1, 0.02], // opacity of the blurred border behind
    duration: [1, 0.4, 12, 0.1],
    radius: [24, 0, 40, 1],
  });

  return (
    <div className="stage">
      <header className="chips-bar">
        <ChipGroup label="Type" options={TYPES} value={type} onChange={setType} />
        <a className="nav-link" href="/">← border-beam version</a>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setAppearance(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? '☾' : '☀'}
        </button>
      </header>

      <main className="stage__center">
        <CustomBeam
          active={beam.active}
          colors={[beam.color1, beam.color2, beam.color3, beam.color4]}
          spread={beam.spread}
          thickness={beam.thickness}
          glow={beam.glow}
          strength={beam.strokeOpacity}
          blurOpacity={beam.blurOpacity}
          duration={beam.duration}
          radius={type === 'Multi line' ? beam.radius : 9999}
          brightness={resolvedTheme === 'light' ? 1.7 : 1}
          saturation={resolvedTheme === 'light' ? 0.7 : 1}
        >
          <ChatInput
            state={state}
            recipient={recipient}
            onRecipientChange={setRecipient}
            type={type}
            value={value}
            onValueChange={setValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmit={handleSubmit}
            resizeTransition={{ type: 'spring' }}
            rollTransition={{ type: 'spring' }}
            roll={{ blur: 6, travel: 30, fade: 0 }}
          />
        </CustomBeam>
      </main>

      <DialRoot theme={resolvedTheme} position="top-right" defaultOpen={false} mode="popover" />
    </div>
  );
}
