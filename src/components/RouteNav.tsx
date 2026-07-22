import './RouteNav.css';

const ROUTES = [
  { href: '/input', label: 'Input' },
  { href: '/header', label: 'Header' },
];

/**
 * Fixed top-center route switcher shared by the prototype pages. Uses plain
 * anchors so it works with the app's reload-based pathname routing. (The
 * "press R" tip lives only on the home page.)
 */
export function RouteNav() {
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
    </nav>
  );
}
