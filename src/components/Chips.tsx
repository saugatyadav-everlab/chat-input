import './Chips.css';

interface ChipGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}

export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  return (
    <div className="chip-group">
      <span className="chip-group__label">{label}</span>
      <div className="chip-group__row">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`chip ${opt === value ? 'chip--active' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ToggleChipProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleChip({ label, value, onChange }: ToggleChipProps) {
  return (
    <div className="chip-group">
      <span className="chip-group__label">{label}</span>
      <div className="chip-group__row">
        <button
          type="button"
          className={`chip ${value ? 'chip--active' : ''}`}
          onClick={() => onChange(!value)}
        >
          {value ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
