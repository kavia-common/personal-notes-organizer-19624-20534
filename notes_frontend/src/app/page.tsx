"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updatedAt: number;
  createdAt: number;
};

type Folder = {
  id: string;
  name: string;
  createdAt: number;
};

const STORAGE_NOTES = "ocean_notes__notes";
const STORAGE_FOLDERS = "ocean_notes__folders";
const STORAGE_SELECTED_NOTE = "ocean_notes__selectedNote";
const STORAGE_SELECTED_FOLDER = "ocean_notes__selectedFolder";

/**
 * Simple UUID v4 generator using crypto.getRandomValues
 * RFC4122 compliant format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function uuidv4(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoObj: any = globalThis.crypto || (globalThis as any).msCrypto;
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  // Per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    hex.slice(4, 6).join("-") +
    hex.slice(6, 8).join("-") +
    hex.slice(8, 10).join("-") +
    hex.slice(10, 16).join("")
  );
}

// Utility to format timestamps
function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

// PUBLIC_INTERFACE
export default function Home() {
  /**
   * State
   */
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  /**
   * Load from localStorage on first mount
   */
  useEffect(() => {
    try {
      const f = JSON.parse(localStorage.getItem(STORAGE_FOLDERS) || "[]") as Folder[];
      const n = JSON.parse(localStorage.getItem(STORAGE_NOTES) || "[]") as Note[];
      const sf = localStorage.getItem(STORAGE_SELECTED_FOLDER);
      const sn = localStorage.getItem(STORAGE_SELECTED_NOTE);

      setFolders(f);
      setNotes(n);
      if (sf) setSelectedFolderId(sf);
      if (sn) setSelectedNoteId(sn);
    } catch {
      // ignore parse errors
    }
  }, []);

  /**
   * Persist changes
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_FOLDERS, JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (selectedFolderId) {
      localStorage.setItem(STORAGE_SELECTED_FOLDER, selectedFolderId);
    } else {
      localStorage.removeItem(STORAGE_SELECTED_FOLDER);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    if (selectedNoteId) {
      localStorage.setItem(STORAGE_SELECTED_NOTE, selectedNoteId);
    } else {
      localStorage.removeItem(STORAGE_SELECTED_NOTE);
    }
  }, [selectedNoteId]);

  /**
   * Derived lists
   */
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => (selectedFolderId ? n.folderId === selectedFolderId : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedFolderId]);

  /**
   * Actions: Folders
   */
  const addFolder = () => {
    const name = prompt("New folder name")?.trim();
    if (!name) return;
    const folder: Folder = { id: uuidv4(), name, createdAt: Date.now() };
    setFolders((prev) => [folder, ...prev]);
    setSelectedFolderId(folder.id);
  };

  const renameFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const newName = prompt("Rename folder", folder.name)?.trim();
    if (!newName) return;
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)));
  };

  const deleteFolder = (folderId: string) => {
    const count = notes.filter((n) => n.folderId === folderId).length;
    const ok = confirm(
      `Delete this folder? ${count ? `It contains ${count} note(s) which will be moved to Inbox.` : ""}`
    );
    if (!ok) return;
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null, updatedAt: Date.now() } : n))
    );
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  /**
   * Actions: Notes
   */
  const addNote = useCallback(() => {
    const now = Date.now();
    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled",
      content: "",
      folderId: selectedFolderId || null,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  }, [selectedFolderId]);

  const duplicateNote = (noteId: string) => {
    const base = notes.find((n) => n.id === noteId);
    if (!base) return;
    const now = Date.now();
    const copy: Note = {
      ...base,
      id: uuidv4(),
      title: `${base.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [copy, ...prev]);
    setSelectedNoteId(copy.id);
  };

  const deleteNote = (noteId: string) => {
    const ok = confirm("Delete this note?");
    if (!ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const updateNote = (patch: Partial<Note>) => {
    if (!selectedNote) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNote.id
          ? { ...n, ...patch, updatedAt: Date.now() }
          : n
      )
    );
  };

  const moveNoteToFolder = (noteId: string, folderId: string | null) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, folderId, updatedAt: Date.now() } : n))
    );
  };

  /**
   * Keyboard shortcuts
   * - Ctrl/Cmd+N new note
   * - Ctrl/Cmd+S prevent default
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addNote();
      }
      if (isMeta && e.key.toLowerCase() === "s") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addNote]);

  /**
   * UI
   */
  return (
    <main className="flex-1 flex flex-col">
      {/* App Bar */}
      <header className="appbar">
        <div className="appbar-inner">
          <div className="brand">
            <span className="brand-badge">ON</span>
            <span className="brand-title">Ocean Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="primary-btn rounded-lg"
              onClick={addNote}
              aria-label="New Note"
              title="New Note (Ctrl/Cmd+N)"
            >
              + New Note
            </button>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <section className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-12 gap-4 px-4 sm:px-6 lg:px-8 py-4">
        {/* Left: Folders */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 surface p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="panel-title">Folders</h3>
            <div className="flex items-center gap-2">
              <button
                className="text-xs font-bold px-3 py-1 rounded-lg"
                style={{ background: "rgba(16,185,129,0.18)", color: "#10B981" }}
                onClick={addFolder}
              >
                + Add
              </button>
            </div>
          </div>

          <div className="scroll-slim max-h-[calc(100vh-14rem)] overflow-y-auto space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                selectedFolderId === null
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
            >
              Inbox
            </button>
            {folders.map((folder) => (
              <div key={folder.id} className="group">
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center justify-between ${
                    selectedFolderId === folder.id
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <button
                      className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        renameFolder(folder.id);
                      }}
                      aria-label="Rename folder"
                    >
                      Rename
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder.id);
                      }}
                      aria-label="Delete folder"
                    >
                      Delete
                    </button>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Notes List */}
        <section className="col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4 surface p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="panel-title">Notes</h3>
            <div className="flex items-center gap-2">
              <button
                className="text-xs font-bold px-3 py-1 rounded-lg"
                style={{ background: "rgba(249,115,22,0.18)", color: "#F97316" }}
                onClick={addNote}
              >
                + New
              </button>
            </div>
          </div>

          <div className="scroll-slim max-h-[calc(100vh-14rem)] overflow-y-auto space-y-2">
            {filteredNotes.length === 0 ? (
              <div className="text-white/60 text-sm px-3 py-8 text-center bg-black/20 rounded-lg border border-white/10">
                No notes yet. Create your first note.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const active = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    className={`rounded-lg border transition cursor-pointer ${
                      active
                        ? "border-white/20 bg-white/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <div className="p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold truncate">{note.title || "Untitled"}</div>
                        <div className="text-xs text-white/60 truncate">
                          {formatDate(note.updatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          className="text-xs bg-black/30 border border-white/10 rounded-md px-2 py-1 outline-none"
                          value={note.folderId ?? ""}
                          onChange={(e) =>
                            moveNoteToFolder(note.id, e.target.value ? e.target.value : null)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Move note to folder"
                        >
                          <option value="">Inbox</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateNote(note.id);
                          }}
                          aria-label="Duplicate note"
                        >
                          Duplicate
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          aria-label="Delete note"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Editor/Viewer */}
        <section className="col-span-12 md:col-span-5 lg:col-span-5 xl:col-span-5 surface p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="panel-title">Editor</h3>
            <div className="flex items-center gap-2">
              {selectedNote && (
                <>
                  <button
                    className="text-xs font-bold px-3 py-1 rounded-lg"
                    style={{ background: "rgba(16,185,129,0.18)", color: "#10B981" }}
                    onClick={() => duplicateNote(selectedNote.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    className="text-xs font-bold px-3 py-1 rounded-lg danger"
                    onClick={() => deleteNote(selectedNote.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {!selectedNote ? (
            <div className="h-[calc(100%-2rem)] min-h-[420px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20">
              <div className="text-center px-8">
                <div className="text-2xl font-black mb-2">Select a note</div>
                <div className="text-white/60">
                  Choose a note from the center panel or create a new one.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                className="input text-xl font-extrabold tracking-tight"
                placeholder="Note title"
                value={selectedNote.title}
                onChange={(e) => updateNote({ title: e.target.value })}
              />
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>Updated {formatDate(selectedNote.updatedAt)}</span>
                <span className="mx-2 opacity-30">•</span>
                <span>Created {formatDate(selectedNote.createdAt)}</span>
                <span className="mx-2 opacity-30">•</span>
                <label className="flex items-center gap-2">
                  <span className="text-white/60">Folder:</span>
                  <select
                    className="text-xs bg-black/30 border border-white/10 rounded-md px-2 py-1 outline-none"
                    value={selectedNote.folderId ?? ""}
                    onChange={(e) =>
                      updateNote({ folderId: e.target.value ? e.target.value : null })
                    }
                  >
                    <option value="">Inbox</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea
                className="input min-h-[50vh] leading-relaxed"
                placeholder="Start writing..."
                value={selectedNote.content}
                onChange={(e) => updateNote({ content: e.target.value })}
              />
            </div>
          )}
        </section>
      </section>

      {/* Footer subtle accent */}
      <footer className="mt-auto py-6 text-center text-white/40 text-xs">
        <span className="px-3 py-1 rounded-full" style={{ background: "rgba(249,115,22,0.08)" }}>
          Made with Ocean Professional
        </span>
      </footer>
    </main>
  );
}
