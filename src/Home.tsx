import { useEffect } from 'react';
import { useSystemDark } from './App';
import './Home.css';

const CARDS = [
  {
    href: '/beams',
    label: 'Chat input field',
    desc: 'Halo treatments and states',
  },
  {
    href: '/reply',
    label: 'Chat input field header',
    desc: 'Banner entry and morphing animations.',
  },
];

export default function Home() {
  const dark = useSystemDark();
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <div className="stage home">
      <div className="home__inner">
        <header className="home__head">
          <h1 className="home__title">Chat input prototype</h1>
        </header>

        <div className="home__cards">
          {CARDS.map((c) => (
            <a key={c.href} className="home__card" href={c.href}>
              <span className="home__card-label">{c.label}</span>
              <span className="home__card-desc">{c.desc}</span>
            </a>
          ))}
        </div>

        <p className="home__tip">
          Tip: press <kbd>R</kbd> inside a prototype to switch recipient (Eva ⇄ Care team).
        </p>
      </div>
    </div>
  );
}
