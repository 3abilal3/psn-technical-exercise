import './FilterStatus.css';

interface FilterStatusProps {
  hint: {
    tone: 'info' | 'warn';
    title: string;
    detail: string;
  };
}

export function FilterStatus({ hint }: FilterStatusProps) {
  return (
    <div className={`filter-status tone-${hint.tone}`} role="status">
      <strong>{hint.title}</strong>
      <p>{hint.detail}</p>
    </div>
  );
}
