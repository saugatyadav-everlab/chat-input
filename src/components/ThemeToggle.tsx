/** Fixed top-right dark/light mode selector, shared by the prototype routes. */
export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light';
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="theme-toggle theme-toggle--corner"
      onClick={onToggle}
      aria-label="Toggle light / dark mode"
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  );
}
