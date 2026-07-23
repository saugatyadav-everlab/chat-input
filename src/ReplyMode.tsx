import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

import { Beam } from './BeamLayer';
import { RouteNav } from './components/RouteNav';
import { ThemeToggle } from './components/ThemeToggle';
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
  const [careAssigned, setCareAssigned] = useState(true);
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
      setProcessing(false); // Care team is never in a pausable processing state
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
    // Care team: sending just resets the field — no pausable processing state
    if (recipient !== 'Copilot') {
      setValue('');
      return;
    }
    if (processing) return setProcessing(false);
    setProcessing(true);
    setValue('');
  };

  const cfg = useDialKit('Header entry', {
    transition: { type: 'spring', bounce: 0.35, visualDuration: 0.25 },
    stagger: [0.08, 0, 0.3, 0.01], // delay between banner children
    childDelay: [0, 0, 0.5, 0.01], // wait for the banner to start opening
    childShift: [2, 0, 32, 1], // how far each child slides up (px)
  });
  const entry = cfg.transition as unknown as Transition;

  // The container's height animation is tuned per kind of transition (decoupled
  // from the child animations above):
  //  - "Banner morph"  → banner ↔ banner (Care ↔ Eva): small delta, tight feel
  //  - "Banner reveal" → banner ↔ none (grow from 0 / collapse to 0): full travel
  const morphCfg = useDialKit('Banner morph', {
    transition: { type: 'spring', bounce: 0.3, visualDuration: 0.4 },
  });
  const morphTx = morphCfg.transition as unknown as Transition;
  const revealCfg = useDialKit('Banner reveal', {
    transition: { type: 'spring', bounce: 0.25, visualDuration: 0.3 },
    childDelay: [0.04, 0, 0.5, 0.01], // children wait for the banner to open, THEN scale in (so the scale is visible, not masked by the reveal)
    collapseDelay: [0.12, 0, 0.5, 0.01], // slight lead so children start leaving, then the banner drops (overlapping)
  });
  const revealTx = revealCfg.transition as unknown as Transition;

  // shell just propagates the variant label (hidden/show/exit) down to the children,
  // so on exit the children animate away (rather than the whole block hard-fading)
  const shell = { hidden: {}, show: {}, exit: {} };
  const item = {
    hidden: { opacity: 0, y: cfg.childShift },
    show: { opacity: 1, y: 0, transition: entry },
    exit: { opacity: 0, y: cfg.childShift, transition: entry }, // fade + slide back
  };
  // avatar / question icon: scale from centre + opacity + blur (blurred while
  // changing, sharp once settled — feels softer on the swap)
  const avatarItem = {
    hidden: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
    show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: entry },
    exit: { opacity: 0, scale: 0.6, filter: 'blur(4px)', transition: entry },
  };

  const isEva = recipient === 'Copilot';
  // A banner needs a care team assigned. In Care team you always see "Replying to …";
  // in Eva the "Done asking Eva?" banner only appears while a reply is owed
  // (nothing to prompt back to otherwise).
  const showHeader = careAssigned && (!isEva || replyOwed);
  const headerKey = isEva ? 'eva' : 'care';

  // Measure the natural height of the current banner content and animate the
  // container's real `height` to it. This keeps the container's grow/shrink fully
  // decoupled from the children: no Framer `layout` projection means the child
  // animations aren't scale-corrected over the container's (tunable) duration.
  // The measure wrapper is statically positioned, so the outgoing (popLayout-
  // absolute) banner doesn't affect its offsetHeight — we always read the height
  // of the incoming content.
  const contentRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (el) setHeaderH(showHeader ? el.offsetHeight : 0);
  }, [showHeader, headerKey, recipient, careAssigned, replyOwed]);

  // Choose the height spring by kind of transition: growing from / collapsing to
  // 0 is a "reveal" (full travel); otherwise it's a banner↔banner "morph".
  // `prevH` holds the previously-committed height so we can tell which one this is.
  const prevHRef = useRef<number | null>(null);
  const isReveal = headerH === 0 || prevHRef.current === 0 || prevHRef.current === null;
  const isCollapsing = headerH === 0;
  // Reveal → banner↔none; morph → banner↔banner. On collapse, hold the height for
  // `collapseDelay` so the children animate away first, then the banner drops.
  const containerTx: Transition = isReveal
    ? isCollapsing
      ? ({ ...(revealTx as object), delay: revealCfg.collapseDelay } as Transition)
      : revealTx
    : morphTx;
  useEffect(() => {
    if (headerH !== null) prevHRef.current = headerH;
  }, [headerH]);

  // staggered entry for the banner's children. The lead-in delay is state-specific:
  // children wait `revealCfg.childDelay` on a grow, but start with the banner on a morph.
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: cfg.stagger,
        delayChildren: isReveal ? revealCfg.childDelay : cfg.childDelay,
      },
    },
    exit: { transition: { staggerChildren: 0 } }, // on collapse, all children leave together (no stagger)
  };

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
      <RouteNav />
      <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
      <header className="chips-bar">
        <ToggleChip label="Care assigned" value={careAssigned} onChange={setCareAssigned} />
        <ToggleChip label="Reply owed" value={replyOwed} onChange={setReplyOwed} />
      </header>

      {/* input pinned to the bottom (real chat UI): the header grows upward,
          the input itself never moves */}
      <main className="stage__center stage__center--anchor">
        <div className="rf">
          {/* one persistent header container: its real `height` animates to fit
              whatever content comes next (Care↔Eva, or →0 when no care team is
              assigned) instead of fully collapsing and re-expanding. Animating
              height (not Framer `layout`) keeps this decoupled from the children. */}
          <motion.div
            className="rf-header"
            initial={false}
            animate={headerH === null ? undefined : { height: headerH }}
            transition={containerTx}
          >
            <div className="rf-header__measure" ref={contentRef}>
              <AnimatePresence mode="popLayout" initial={false}>
                {showHeader && (
                  <motion.div
                    key={headerKey}
                    className="rf-header__inner"
                    variants={shell}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                  >
                  {isEva ? (
                    <motion.div className="rf-suggestion" variants={container}>
                      <motion.span className="rf-suggestion__icon" variants={avatarItem}>
                        <Icon name="help" />
                      </motion.span>
                      <motion.span className="rf-suggestion__text" variants={item}>
                        Done asking Eva?
                      </motion.span>
                      {/* CTA (back to care team) — the Eva banner only renders while a
                          reply is owed, so this always accompanies it */}
                      <motion.button
                        type="button"
                        className="rf-suggestion__cta"
                        variants={item}
                        onClick={() => setRecipient('Care team')}
                      >
                        Switch to care team
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div className="rf-prefix" variants={container}>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <Beam settings={beamSettings} fill>
            <ChatInput {...fieldProps} />
          </Beam>
        </div>
      </main>

      <DialRoot theme={theme} position="top-right" defaultOpen={false} mode="popover" />
    </div>
  );
}
