import './RouteNav.css';

const ROUTES = [
  { href: '/beams', label: 'Beams' },
  { href: '/reply', label: 'Reply' },
];

/**
 * Fixed top-center route switcher shared by the prototype pages, plus the
 * "press R to switch recipient" hint. Uses plain anchors so it works with the
 * app's reload-based pathname routing.
 */
export function RouteNav({ hint = true }: { hint?: boolean }) {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return (
    <nav className="route-nav" aria-label="Prototype">
      <div className="route-nav__seg">
        <a className="route-nav__home" href="/" aria-label="All prototypes">
          ←
        </a>
        {ROUTES.map((r) => (
          <a
            key={r.href}
            href={r.href}
            className={`route-nav__pill${path === r.href ? ' is-active' : ''}`}
            aria-current={path === r.href ? 'page' : undefined}
          >
            {r.label}
          </a>
        ))}
      </div>
      {hint && (
        <span className="route-nav__hint">
          Press <kbd>R</kbd> to switch recipient
        </span>
      )}
    </nav>
  );
}
