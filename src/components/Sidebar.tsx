import { useEffect, useState } from 'react';

import { groupByMonth } from '../lib/sidebar';
import { listJournalFiles } from '../lib/storage';
import { useMargin } from '../store';

export function Sidebar(): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const activeFilename = useMargin((s) => s.activeFilename);
  const setActiveFilename = useMargin((s) => s.setActiveFilename);
  const refreshKey = useMargin((s) => s.refreshKey);

  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (journalDir === null) return;
    let cancelled = false;
    void listJournalFiles(journalDir)
      .then((list) => {
        if (cancelled) return;
        setFiles(list);
      })
      .catch(() => {
        // Surface only via app-level error toast; sidebar just stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, [journalDir, refreshKey]);

  const groups = groupByMonth(files);

  if (groups.length === 0) {
    return (
      <nav className="sb" aria-label="Prior days">
        <p className="sb-empty">No prior days yet — today is day 1.</p>
      </nav>
    );
  }

  return (
    <nav className="sb" aria-label="Prior days">
      {groups.map((g) => (
        <section key={g.month} className="sb-month">
          <h3 className="sb-month-header">{g.month}</h3>
          <ul className="sb-days">
            {g.days.map((d) => {
              const isActive = activeFilename === d.filename;
              return (
                <li key={d.filename}>
                  <button
                    type="button"
                    className={`sb-day${isActive ? ' is-active' : ''}`}
                    onClick={() => setActiveFilename(d.filename)}
                  >
                    {d.dateString}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
