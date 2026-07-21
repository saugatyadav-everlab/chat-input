import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RecipientDropdown.css';
import { CustomBeam } from '../CustomBeam';
import type { Recipient } from './ChatInput';

// same angular gradient as the Custom Beam
const HALO_COLORS = ['#E1915F', '#FFCBAB', '#C4B8FF', '#F37938'];

/* ---- icons (exact Figma vectors, currentColor) ---- */
function AiIcon() {
  return (
    <span className="rd-ai">
      <svg className="rd-ai__s1" viewBox="0 0 15 14.1667" fill="none" aria-hidden>
        <path d="M7.5 0C7.5 0 7.86862 3.06747 9.81036 4.90133C11.7521 6.73519 15 7.08333 15 7.08333C15 7.08333 11.7521 7.43148 9.81036 9.26534C7.86862 11.0992 7.5 14.1667 7.5 14.1667C7.5 14.1667 7.13138 11.0992 5.18964 9.26534C3.24791 7.43148 0 7.08333 0 7.08333C0 7.08333 3.24791 6.73519 5.18964 4.90133C7.13138 3.06747 7.5 0 7.5 0Z" fill="currentColor" />
      </svg>
      <svg className="rd-ai__s2" viewBox="0 0 5.83333 5.83333" fill="none" aria-hidden>
        <path d="M2.91667 0C2.91667 0 3.03677 1.53123 3.66944 2.16389C4.30211 2.79656 5.83333 2.91667 5.83333 2.91667C5.83333 2.91667 4.30211 3.03677 3.66944 3.66944C3.03677 4.30211 2.91667 5.83333 2.91667 5.83333C2.91667 5.83333 2.79656 4.30211 2.16389 3.66944C1.53123 3.03677 0 2.91667 0 2.91667C0 2.91667 1.53123 2.79656 2.16389 2.16389C2.79656 1.53123 2.91667 0 2.91667 0Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function UsersIcon() {
  return (
    <svg className="rd-users" viewBox="0 0 18.3333 16.6667" fill="none" aria-hidden>
      <path d="M7.5 0C10.2614 0 12.5 2.23858 12.5 5C12.5 6.62147 11.7269 8.06104 10.5306 8.97461C11.3697 9.34528 12.1424 9.86861 12.8035 10.5298C14.2101 11.9363 15 13.8442 15 15.8333C15 16.2936 14.6269 16.6667 14.1667 16.6667C13.7064 16.6667 13.3333 16.2936 13.3333 15.8333C13.3333 14.2862 12.7191 12.8021 11.6252 11.7082C10.5995 10.6825 9.23081 10.0788 7.7889 10.0073L7.5 10C5.9529 10 4.4688 10.6142 3.37484 11.7082C2.28088 12.8021 1.66667 14.2862 1.66667 15.8333C1.66667 16.2936 1.29357 16.6667 0.833333 16.6667C0.373096 16.6667 0 16.2936 0 15.8333C0 13.8442 0.789929 11.9363 2.19645 10.5298C2.85745 9.86879 3.62974 9.34526 4.46859 8.97461C3.27257 8.06102 2.5 6.62124 2.5 5C2.5 2.23858 4.73858 0 7.5 0ZM13.0745 0.992025C13.3092 0.596319 13.8205 0.465439 14.2163 0.69987C14.9232 1.11912 15.5164 1.70681 15.9424 2.40967C16.3682 3.11243 16.614 3.90934 16.6585 4.72982C16.703 5.55047 16.5445 6.36945 16.1971 7.11426C15.9938 7.55003 15.7278 7.95113 15.4118 8.30892C16.972 9.82797 18.3333 12.3144 18.3333 15C18.3333 15.4602 17.9602 15.8332 17.5 15.8333C17.0398 15.8333 16.6667 15.4602 16.6667 15C16.6666 12.4911 15.1545 10.1161 13.6662 8.99984C13.4566 8.84246 13.3334 8.59541 13.3333 8.33333C13.3334 8.07123 13.4566 7.82419 13.6662 7.66683C14.1044 7.33802 14.4551 6.90603 14.6867 6.40951C14.9183 5.91302 15.024 5.36719 14.9943 4.82015C14.9646 4.27304 14.8006 3.7417 14.5166 3.27311C14.2327 2.80466 13.8378 2.41327 13.3667 2.13379C12.9711 1.89905 12.8401 1.38778 13.0745 0.992025ZM7.5 1.66667C5.65905 1.66667 4.16667 3.15905 4.16667 5C4.16667 6.84095 5.65905 8.33333 7.5 8.33333C9.34095 8.33333 10.8333 6.84095 10.8333 5C10.8333 3.15905 9.34095 1.66667 7.5 1.66667Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="rd-check__glyph" viewBox="0 0 6.42857 5" fill="none" aria-hidden>
      <path d="M2.35712 5C2.13783 5 1.91812 4.90973 1.75112 4.72897L0.188355 3.03955C-0.062785 2.76829 -0.062785 2.32808 0.188355 2.05682C0.439495 1.78532 0.846276 1.78532 1.09742 2.05682L2.35712 3.41868L5.33116 0.20362C5.5823 -0.0678733 5.98908 -0.0678733 6.24022 0.20362C6.49136 0.474881 6.49136 0.915093 6.24022 1.18635L2.96311 4.72897C2.79611 4.90973 2.5764 5 2.35712 5Z" fill="currentColor" />
    </svg>
  );
}

interface Props {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  recipient: Recipient;
  onSelect: (r: Recipient) => void;
  onClose: () => void;
}

export function RecipientDropdown({ open, anchorRef, recipient, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  // the dropdown is portaled to <body>, so inherit the theme of the field it opened from
  const [theme, setTheme] = useState<string | undefined>(undefined);

  // position above the pill, right-aligned, clamped to the viewport
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const width = 320;
    const r = anchorRef.current.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.right - width), window.innerWidth - width - 8);
    const bottom = window.innerHeight - r.top + 8;
    setPos({ left, bottom });
    setTheme(anchorRef.current.closest('[data-theme]')?.getAttribute('data-theme') ?? undefined);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;

  const item = (
    value: Recipient,
    icon: React.ReactNode,
    title: string,
    sub: string,
    halo: boolean,
    badge?: string
  ) => (
    <button
      className="rd-item"
      type="button"
      role="menuitemradio"
      aria-checked={recipient === value}
      onClick={() => {
        onSelect(value);
        onClose();
      }}
    >
      <span className="rd-item__icon">
        {halo ? (
          <CustomBeam
            active
            colors={HALO_COLORS}
            spread={360}
            thickness={1}
            strength={0.72}
            glow={6}
            blurOpacity={0.35}
            duration={3}
            radius={14}
          >
            <span className="rd-tile">{icon}</span>
          </CustomBeam>
        ) : (
          <span className="rd-tile">{icon}</span>
        )}
      </span>
      <span className="rd-item__content">
        <span className="rd-item__titlerow">
          <span className="rd-item__title">{title}</span>
          {badge && <span className="rd-badge">{badge}</span>}
        </span>
        <span className="rd-item__sub">{sub}</span>
      </span>
      {recipient === value && (
        <span className="rd-check" aria-hidden>
          <CheckIcon />
        </span>
      )}
    </button>
  );

  return createPortal(
    <div
      ref={ref}
      className="rd"
      data-theme={theme}
      role="menu"
      style={{ position: 'fixed', left: pos.left, bottom: pos.bottom }}
    >
      <div className="rd__slot" />
      <div className="rd__list">
        {item('Copilot', <AiIcon />, 'Eva', 'Answers immediately', true, 'AI')}
        {item('Care team', <UsersIcon />, 'Everlab Care Team', 'Replies in 1-3 business days', false)}
      </div>
      <div className="rd__slot" />
    </div>,
    document.body
  );
}
