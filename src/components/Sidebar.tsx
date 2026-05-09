import { useEffect, useState } from 'react';
import { FolderPlus, Pencil, Plus } from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';

import { todayDateString } from '../lib/dates';
import {
  appendPage,
  basename,
  createSection,
  deleteJournalFile,
  deleteSection,
  dirname,
  joinPath,
  listJournalFiles,
  listSections,
  renameJournalFile,
  renameSection,
} from '../lib/storage';
import { useMargin } from '../store';
import { EditField } from './EditField';

interface SectionData {
  name: string;
  files: string[];
}

function isInsideDir(filePath: string, dirPath: string): boolean {
  return (
    filePath.startsWith(`${dirPath}/`) || filePath.startsWith(`${dirPath}\\`)
  );
}

function pageDisplay(filename: string): string {
  return filename.endsWith('.md') ? filename.slice(0, -3) : filename;
}

export function Sidebar(): JSX.Element {
  const journalDir = useMargin((s) => s.journalDir);
  const activePath = useMargin((s) => s.activePath);
  const setActivePath = useMargin((s) => s.setActivePath);
  const refreshKey = useMargin((s) => s.refreshKey);
  const bumpRefresh = useMargin((s) => s.bumpRefresh);

  const [rootFiles, setRootFiles] = useState<string[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  // editingId encodes which row is in edit mode:
  //   'new-section' for the new-section input
  //   `section:<name>` for a section header
  //   `page:<absolute-path>` for a page row
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (journalDir === null) return;
    let cancelled = false;
    void (async () => {
      try {
        const [root, secNames] = await Promise.all([
          listJournalFiles(journalDir),
          listSections(journalDir),
        ]);
        const secs: SectionData[] = await Promise.all(
          secNames.map(async (name) => ({
            name,
            files: await listJournalFiles(joinPath(journalDir, name)),
          })),
        );
        if (cancelled) return;
        setRootFiles(root.sort().reverse());
        setSections(secs);
      } catch {
        // App-level error toast surfaces issues; sidebar just stays empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [journalDir, refreshKey]);

  async function addSectionCommit(name: string): Promise<void> {
    if (journalDir === null) return;
    await createSection(journalDir, name);
    setEditingId(null);
    bumpRefresh();
  }

  async function renameSectionCommit(
    oldName: string,
    newName: string,
  ): Promise<void> {
    if (journalDir === null) return;
    if (oldName === newName) {
      setEditingId(null);
      return;
    }
    await renameSection(journalDir, oldName, newName);
    if (activePath !== null) {
      const oldDir = joinPath(journalDir, oldName);
      if (isInsideDir(activePath, oldDir)) {
        const tail = activePath.slice(oldDir.length + 1);
        setActivePath(joinPath(joinPath(journalDir, newName), tail));
      }
    }
    setEditingId(null);
    bumpRefresh();
  }

  async function deleteSectionCommit(
    name: string,
    files: string[],
  ): Promise<void> {
    if (journalDir === null) return;
    const summary =
      files.length === 0
        ? `Delete section "${name}"?`
        : `Delete section "${name}" and its ${files.length} page${files.length === 1 ? '' : 's'}? This can't be undone.`;
    const yes = await confirm(summary, {
      title: 'Delete section',
      kind: 'warning',
    });
    if (!yes) return;
    const sectionDir = joinPath(journalDir, name);
    await deleteSection(sectionDir);
    if (activePath !== null && isInsideDir(activePath, sectionDir)) {
      setActivePath(null);
    }
    setEditingId(null);
    bumpRefresh();
  }

  async function addPage(dir: string, base: string): Promise<void> {
    const filename = await appendPage(dir, base);
    setActivePath(joinPath(dir, filename));
    bumpRefresh();
  }

  async function renamePageCommit(
    oldPath: string,
    newName: string,
  ): Promise<void> {
    const dir = dirname(oldPath);
    const newPath = joinPath(dir, `${newName}.md`);
    if (oldPath === newPath) {
      setEditingId(null);
      return;
    }
    await renameJournalFile(oldPath, newPath);
    if (activePath === oldPath) {
      setActivePath(newPath);
    }
    setEditingId(null);
    bumpRefresh();
  }

  async function deletePageCommit(filePath: string): Promise<void> {
    const display = pageDisplay(basename(filePath));
    const yes = await confirm(`Delete ${display}?`, {
      title: 'Delete page',
      kind: 'warning',
    });
    if (!yes) return;
    await deleteJournalFile(filePath);
    if (activePath === filePath) {
      setActivePath(null);
    }
    setEditingId(null);
    bumpRefresh();
  }

  function renderPageRow(filePath: string): JSX.Element {
    const filename = basename(filePath);
    const display = pageDisplay(filename);
    const editId = `page:${filePath}`;
    const isEditing = editingId === editId;
    const isActive = activePath === filePath;
    return (
      <li key={filePath} className="sb-page-row">
        {isEditing ? (
          <EditField
            initialValue={display}
            kind="page"
            onSave={(name) => renamePageCommit(filePath, name)}
            onCancel={() => setEditingId(null)}
            onDelete={() => deletePageCommit(filePath)}
          />
        ) : (
          <>
            <button
              type="button"
              className={`sb-page${isActive ? ' is-active' : ''}`}
              onClick={() => setActivePath(filePath)}
            >
              {display}
            </button>
            <button
              type="button"
              className="sb-row-edit"
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(editId);
              }}
              aria-label={`Edit ${display}`}
              title="Rename / delete"
            >
              <Pencil size={12} aria-hidden="true" />
            </button>
          </>
        )}
      </li>
    );
  }

  return (
    <nav className="sb" aria-label="Sections and pages">
      {editingId === 'new-section' ? (
        <div className="sb-new-section">
          <EditField
            initialValue=""
            placeholder="Section name"
            kind="section"
            onSave={addSectionCommit}
            onCancel={() => setEditingId(null)}
          />
        </div>
      ) : (
        <button
          type="button"
          className="sb-add-section"
          onClick={() => setEditingId('new-section')}
          disabled={journalDir === null}
        >
          <FolderPlus size={14} aria-hidden="true" />
          <span>New section</span>
        </button>
      )}

      {/* Daily — virtual group for files at the journalDir root. Its header
       * isn't editable (there's no folder to rename/delete); only the +
       * button is exposed. */}
      <section className="sb-section">
        <header className="sb-section-header">
          <h3 className="sb-section-name">Daily</h3>
          <div className="sb-section-actions">
            <button
              type="button"
              className="sb-row-edit"
              onClick={() => {
                if (journalDir === null) return;
                void addPage(journalDir, todayDateString());
              }}
              disabled={journalDir === null}
              aria-label="Add a new page for today"
              title="Add a page for today"
            >
              <Plus size={14} aria-hidden="true" />
            </button>
          </div>
        </header>
        {rootFiles.length === 0 ? (
          <p className="sb-empty">Today's page will appear here.</p>
        ) : (
          <ul className="sb-pages">{rootFiles.map(renderPageRow)}</ul>
        )}
      </section>

      {sections.map((s) => {
        const sectionDir =
          journalDir !== null ? joinPath(journalDir, s.name) : '';
        const editId = `section:${s.name}`;
        const isEditing = editingId === editId;
        return (
          <section key={s.name} className="sb-section">
            <header className="sb-section-header">
              {isEditing ? (
                <EditField
                  initialValue={s.name}
                  kind="section"
                  onSave={(newName) => renameSectionCommit(s.name, newName)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => deleteSectionCommit(s.name, s.files)}
                />
              ) : (
                <>
                  <h3 className="sb-section-name">{s.name}</h3>
                  <div className="sb-section-actions">
                    <button
                      type="button"
                      className="sb-row-edit"
                      onClick={() => {
                        if (sectionDir === '') return;
                        void addPage(sectionDir, 'untitled');
                      }}
                      aria-label={`Add a page in ${s.name}`}
                      title="Add a page"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="sb-row-edit"
                      onClick={() => setEditingId(editId)}
                      aria-label={`Edit section ${s.name}`}
                      title="Rename / delete section"
                    >
                      <Pencil size={12} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </header>
            {s.files.length === 0 ? (
              <p className="sb-empty">No pages yet.</p>
            ) : (
              <ul className="sb-pages">
                {s.files.map((f) => renderPageRow(joinPath(sectionDir, f)))}
              </ul>
            )}
          </section>
        );
      })}
    </nav>
  );
}
