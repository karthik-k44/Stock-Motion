const ITEMS = [
  { key: 'stock', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
  { key: 'reserved', label: 'Reserved for picking' },
  { key: 'incoming', label: 'Incoming on a delivery' },
] as const;

/** Key for the carton visuals — each state has its own shape cue, not just a colour. */
export function SceneLegend() {
  return (
    <details className="legend" open>
      <summary>Legend</summary>
      <ul>
        {ITEMS.map((i) => (
          <li key={i.key}>
            <span className={`legend-swatch legend-${i.key}`} aria-hidden />
            {i.label}
          </li>
        ))}
      </ul>
    </details>
  );
}
