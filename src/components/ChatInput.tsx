import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import './ChatInput.css';
import { Icon } from './icons';
import { RecipientDropdown } from './RecipientDropdown';

export type FieldState = 'Rest' | 'Active' | 'Filled' | 'Processing';
export type Recipient = 'Care team' | 'Copilot';
export type LineType = 'Multi line' | 'Single line';

export interface ChatInputProps {
  state: FieldState;
  recipient: Recipient;
  onRecipientChange: (r: Recipient) => void;
  type: LineType;
  value: string;
  onValueChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  placeholder?: string;
  /** Spring for the recipient-button width resize */
  resizeTransition: Transition;
  /** Spring for the vertical word roll */
  rollTransition: Transition;
  /** Roll animation properties */
  roll: { blur: number; travel: number; fade: number };
}

// list order (matches the dropdown): Eva on top, Care team below
const RECIPIENT_ORDER: Record<Recipient, number> = { Copilot: 0, 'Care team': 1 };

const PLACEHOLDER = 'Ask anything ...';
const recipientLabel = (r: Recipient) => (r === 'Copilot' ? 'Eva' : 'Care team');

function Submit({ state, onSubmit }: { state: FieldState; onSubmit: () => void }) {
  const enabled = state === 'Filled' || state === 'Processing';
  const cls = [
    'ci-submit',
    enabled ? 'ci-submit--solid' : 'ci-submit--ghost',
    enabled ? '' : 'ci-submit--disabled',
  ].join(' ');

  return (
    <button
      className={cls}
      type="button"
      disabled={!enabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={enabled ? onSubmit : undefined}
      aria-label={state === 'Processing' ? 'Stop' : 'Send'}
    >
      <Icon name={state === 'Processing' ? 'stop' : 'arrow'} />
    </button>
  );
}

export default function ChatInput({
  state, recipient, onRecipientChange, type, value, onValueChange,
  onFocus, onBlur, onSubmit, placeholder = PLACEHOLDER, resizeTransition, rollTransition, roll,
}: ChatInputProps) {
  const isMulti = type === 'Multi line';
  const taRef = useRef<HTMLTextAreaElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // measure the current label so we can animate the real width (no scale/morph)
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [wordW, setWordW] = useState<number>();
  useLayoutEffect(() => {
    if (sizerRef.current) setWordW(sizerRef.current.getBoundingClientRect().width);
  }, [recipient]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, isMulti]);

  // roll direction follows list order: to a higher item (Eva) → roll down; to a lower
  // item (Care team) → roll up.
  const prevRecipient = useRef(recipient);
  const rollDir = RECIPIENT_ORDER[recipient] > RECIPIENT_ORDER[prevRecipient.current] ? 1 : -1;
  useEffect(() => {
    prevRecipient.current = recipient;
  }, [recipient]);

  const rollVariants = {
    from: (d: number) => ({ y: `${d * roll.travel}%`, filter: `blur(${roll.blur}px)`, opacity: roll.fade }),
    in: { y: '0%', filter: 'blur(0px)', opacity: 1 },
    out: (d: number) => ({ y: `${-d * roll.travel}%`, filter: `blur(${roll.blur}px)`, opacity: roll.fade }),
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && state === 'Filled') {
      e.preventDefault();
      onSubmit();
    }
  };

  const commonInputProps = {
    className: 'ci-input',
    placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onValueChange(e.target.value),
    onFocus,
    onBlur,
    onKeyDown: submitOnEnter,
  };

  // The recipient control: width animates on switch, anchored to the right
  // (the whole chat-button group is right-aligned, so the submit stays put and
  // the pill grows/shrinks leftward).
  const recipientPill = (
    <>
      <button
        ref={pillRef}
        className="ci-pill"
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {/* each word rolls vertically as its own rigid block (no scale/morph); the
            window animates its real width via `resizeTransition`. Chevron is a static
            sibling so it never moves. */}
        <motion.span
          className="ci-pill__word"
          animate={{ width: wordW }}
          transition={resizeTransition}
          initial={false}
        >
          {/* invisible spacer: measures the current label + sizes the window on mount */}
          <span ref={sizerRef} className="ci-pill__sizer" aria-hidden>
            {recipientLabel(recipient)}
          </span>
          <AnimatePresence initial={false} custom={rollDir}>
            <motion.span
              key={recipient}
              custom={rollDir}
              className="ci-pill__wordItem"
              variants={rollVariants}
              initial="from"
              animate="in"
              exit="out"
              transition={rollTransition}
            >
              {recipientLabel(recipient)}
            </motion.span>
          </AnimatePresence>
        </motion.span>
        <span className="ci-pill__chev">
          <Icon name="chevron" />
        </span>
      </button>
      <RecipientDropdown
        open={menuOpen}
        anchorRef={pillRef}
        recipient={recipient}
        onSelect={onRecipientChange}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );

  if (!isMulti) {
    return (
      <div className="ci ci--single ci--tertiary">
        <button className="ci-iconbtn" type="button" aria-label="Add" onMouseDown={(e) => e.preventDefault()}>
          <Icon name="plus" />
        </button>
        <input {...commonInputProps} />
        <div className="ci-chatbtn">
          {recipientPill}
          <Submit state={state} onSubmit={onSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="ci ci--multi ci--tertiary">
      <div className="ci-textrow">
        <textarea {...commonInputProps} ref={taRef} rows={1} />
      </div>

      <div className="ci-actions">
        <button className="ci-iconbtn" type="button" aria-label="Add" onMouseDown={(e) => e.preventDefault()}>
          <Icon name="plus" />
        </button>
        <div className="ci-chatbtn">
          {recipientPill}
          <Submit state={state} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}
