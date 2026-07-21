import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

import { Beam } from './BeamLayer';
import { Icon } from './components/icons';
import type { BeamSettings } from './beam';
import { ToggleChip } from './components/Chips';
import ChatInput, {
  type FieldState,
  type Recipient,
  type LineType,
} from './components/ChatInput';
import './App.css';
import './ReplyMode.css';

export default function ReplyMode() {
  const [recipient, setRecipient] = useState<Recipient>('Care team');
  const [replyOwed, setReplyOwed] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // press "r" to toggle recipient (ignored while typing / with a modifier held)
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

  // switching to Eva flashes the container beam (same signal as the base page)
  const [evaSignal, setEvaSignal] = useState(false);
  const evaTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(evaTimer.current);
    if (recipient === 'Copilot') {
      setEvaSignal(true);
      evaTimer.current = window.setTimeout(() => setEvaSignal(false), 1800);
    } else {
      setEvaSignal(false);
    }
    return () => window.clearTimeout(evaTimer.current);
  }, [recipient]);

  // interactive field state
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

  const cfg = useDialKit('Header entry', {
    transition: { type: 'spring', bounce: 0.35, visualDuration: 0.3 },
    stagger: [0.1, 0, 0.3, 0.01], // delay between banner children
    childDelay: [0.08, 0, 0.5, 0.01], // wait for the banner to start opening
    childShift: [8, 0, 32, 1], // how far each child slides up (px)
  });
  const entry = cfg.transition as unknown as Transition;

  // staggered entry for the banner's children (siblings animate in one after another)
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: cfg.stagger, delayChildren: cfg.childDelay } },
  };
  const item = {
    hidden: { opacity: 0, y: cfg.childShift },
    show: { opacity: 1, y: 0, transition: entry },
  };
  // avatar: scale from centre + opacity (no slide)
  const avatarItem = {
    hidden: { opacity: 0, scale: 0.6 },
    show: { opacity: 1, scale: 1, transition: entry },
  };

  const isEva = recipient === 'Copilot';
  // Care team → header only if a reply is owed; Eva → always prompt to switch back
  const showHeader = isEva || replyOwed;
  const headerKey = isEva ? 'eva' : 'care';

  // same border-beam halo as the base route; flashes on the Eva switch
  const beamSettings: BeamSettings = {
    size: 'md',
    colorVariant: 'ocean',
    theme,
    strength: 1,
    duration: 1.96,
    brightness: theme === 'light' ? 1.7 : 1.05,
    saturation: theme === 'light' ? 0.7 : 0.8,
    hueRange: 30,
    hueBase: 156,
    active: evaSignal,
  };

  const fieldProps = {
    state,
    recipient,
    onRecipientChange: setRecipient,
    type: 'Multi line' as LineType,
    value,
    onValueChange: setValue,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onSubmit: handleSubmit,
    placeholder: isEva ? 'Ask Eva ...' : 'Reply Dr. Steven',
    // same pill roll/resize feel as the main input
    resizeTransition: { type: 'spring', bounce: 0.25, visualDuration: 0.3 } as unknown as Transition,
    rollTransition: { type: 'spring', bounce: 0.15, visualDuration: 0.45 } as unknown as Transition,
    roll: { blur: 4, travel: 20, fade: 0 },
  };

  return (
    <div className="stage">
      <header className="chips-bar">
        <ToggleChip label="Reply owed" value={replyOwed} onChange={setReplyOwed} />
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☾' : '☀'}
        </button>
      </header>

      {/* input pinned to the bottom (real chat UI): the header grows upward,
          the input itself never moves */}
      <main className="stage__center stage__center--bottom">
        <div className="rf">
          <AnimatePresence initial mode="wait">
            {showHeader && (
              <motion.div
                key={headerKey}
                className="rf-header"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={entry}
              >
                <div className="rf-header__inner">
                  {isEva ? (
                    <motion.div className="rf-suggestion" variants={container} initial="hidden" animate="show">
                      <motion.span className="rf-suggestion__icon" variants={item}>
                        <Icon name="help" />
                      </motion.span>
                      <motion.span className="rf-suggestion__text" variants={item}>
                        Done asking Eva?
                      </motion.span>
                      <motion.button
                        type="button"
                        className="rf-suggestion__cta"
                        variants={item}
                        onClick={() => {
                          setRecipient('Care team');
                          setReplyOwed(true);
                        }}
                      >
                        Reply Dr. Steven
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div className="rf-prefix" variants={container} initial="hidden" animate="show">
                      <motion.img className="rf-avatar" variants={avatarItem} src="/icons/steven.png" alt="" />
                      <motion.div className="rf-replying" variants={container}>
                        <motion.div className="rf-replying__label" variants={item}>
                          Replying to
                        </motion.div>
                        <motion.div className="rf-replying__name" variants={item}>
                          Dr. Steven Lu
                        </motion.div>
                      </motion.div>
                      <motion.span className="rf-eta" variants={item}>
                        1-3 business days
                      </motion.span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Beam settings={beamSettings} fill>
            <ChatInput {...fieldProps} />
          </Beam>
        </div>
      </main>

      <DialRoot theme={theme} position="bottom-right" defaultOpen mode="popover" />
    </div>
  );
}
