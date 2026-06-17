import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./Explorer.css";

/* ============================================================
   NovaOS Explorer — Real OS File Manager
   ------------------------------------------------------------
   Architecture (modular sub-components):
     - Sidebar         (favorites + storage panel)
     - Toolbar         (back/forward, breadcrumb, search, view toggle)
     - FileList        (grid/list view with sorting + dnd)
     - DetailsPanel    (file metadata)
     - ContextMenu     (right-click menu for files + empty space)
     - Modals          (confirm delete, properties)
     - PreviewWindow   (opens for image / pdf / text)
   State is owned by the root <Explorer/> and threaded down.
   ============================================================ */

/* ---------------- Constants ---------------- */

const FAVORITES = [
  { id: "desktop", name: "Desktop", icon: "desktop" },
  { id: "documents", name: "Documents", icon: "folder" },
  { id: "downloads", name: "Downloads", icon: "download" },
  { id: "projects", name: "Projects", icon: "folder" },
  { id: "images", name: "Images", icon: "image" },
];

/* Mock file system — flat map of path -> children
   Each node: { id, name, type, size, created, modified, parent, children? }
   type: 'folder' | 'image' | 'pdf' | 'document' | 'application' | 'shortcut' | 'text'
*/
const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function makeNode(id, name, type, size, parent, children) {
  return {
    id,
    name,
    type,
    size,
    parent,
    created: now - Math.floor(Math.random() * 30) * day,
    modified: now - Math.floor(Math.random() * 7) * day,
    children: type === "folder" ? children || [] : undefined,
  };
}

function buildInitialFS() {
  const fs = {};

  // Root folders
  fs["desktop"] = makeNode("desktop", "Desktop", "folder", 0, null, []);
  fs["documents"] = makeNode("documents", "Documents", "folder", 0, null, []);
  fs["downloads"] = makeNode("downloads", "Downloads", "folder", 0, null, []);
  fs["projects"] = makeNode("projects", "Projects", "folder", 0, null, []);
  fs["images"] = makeNode("images", "Images", "folder", 0, null, []);

  // Desktop contents
  const d1 = makeNode("d_novaos_lnk", "NovaOS.lnk", "shortcut", 2 * 1024, "desktop");
  const d2 = makeNode("d_homework", "Homework.docx", "document", 24 * 1024, "desktop");
  fs[d1.id] = d1; fs[d2.id] = d2;
  fs["desktop"].children = [d1.id, d2.id];

  // Documents
  const doc1 = makeNode("doc_physics", "Physics Notes.pdf", "pdf", 1.2 * 1024 * 1024, "documents");
  const doc2 = makeNode("doc_business", "Business Plan.docx", "document", 480 * 1024, "documents");
  const doc3 = makeNode("doc_readme", "readme.txt", "text", 4 * 1024, "documents");
  fs[doc1.id] = doc1; fs[doc2.id] = doc2; fs[doc3.id] = doc3;
  fs["documents"].children = [doc1.id, doc2.id, doc3.id];

  // Downloads
  const dl1 = makeNode("dl_wallpaper", "Wallpaper.jpg", "image", 3.4 * 1024 * 1024, "downloads");
  const dl2 = makeNode("dl_setup", "Setup.exe", "application", 12 * 1024 * 1024, "downloads");
  fs[dl1.id] = dl1; fs[dl2.id] = dl2;
  fs["downloads"].children = [dl1.id, dl2.id];

  // Projects (folders)
  const p1 = makeNode("p_novaos", "NovaOS", "folder", 0, "projects", []);
  const p2 = makeNode("p_snapbooks", "SnapBooks", "folder", 0, "projects", []);
  fs[p1.id] = p1; fs[p2.id] = p2;
  fs["projects"].children = [p1.id, p2.id];

  // NovaOS subfolder contents
  const n1 = makeNode("n_source", "src", "folder", 0, "p_novaos", []);
  const n2 = makeNode("n_pkg", "package.json", "document", 2 * 1024, "p_novaos");
  fs[n1.id] = n1; fs[n2.id] = n2;
  fs["p_novaos"].children = [n1.id, n2.id];

  // Images
  const i1 = makeNode("i_space", "space.jpg", "image", 2.8 * 1024 * 1024, "images");
  const i2 = makeNode("i_logo", "logo.png", "image", 420 * 1024, "images");
  fs[i1.id] = i1; fs[i2.id] = i2;
  fs["images"].children = [i1.id, i2.id];

  return fs;
}

/* ---------------- Helpers ---------------- */

const formatSize = (bytes) => {
  if (bytes === 0 || bytes == null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDate = (ts) => {
  if (!ts) return "--";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const typeLabel = (t) => {
  const map = {
    folder: "Folder",
    image: "Image",
    pdf: "PDF Document",
    document: "Document",
    application: "Application",
    shortcut: "Shortcut",
    text: "Text File",
  };
  return map[t] || t;
};

const getExt = (name) => {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
};

/* Detect file type from name when creating new files */
const detectType = (name) => {
  const ext = getExt(name);
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["txt", "md", "log"].includes(ext)) return "text";
  if (["exe", "app", "dmg"].includes(ext)) return "application";
  if (["lnk", "url"].includes(ext)) return "shortcut";
  if (["doc", "docx", "rtf", "odt"].includes(ext)) return "document";
  return "document";
};

/* ============================================================
   File Icon — proper NovaOS icons (SVG, no emoji)
   ============================================================ */
function FileIcon({ type, name, size = 40 }) {
  const s = size;
  const stroke = "rgba(255,255,255,0.55)";

  if (type === "folder") {
    return (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M6 14a3 3 0 0 1 3-3h9l4 4h17a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V14z"
          fill="rgba(120,160,220,0.28)" stroke="rgba(160,200,255,0.55)" strokeWidth="1.5" />
        <path d="M6 18h36v0H6z" stroke="rgba(160,200,255,0.25)" strokeWidth="1" />
      </svg>
    );
  }

  // File sheet with type-specific badge
  const ext = getExt(name || "");
  let badgeColor = "rgba(180,200,220,0.8)";
  let badgeText = ext.slice(0, 3).toUpperCase() || "FILE";
  if (type === "image") { badgeColor = "#7fd1b9"; badgeText = "IMG"; }
  else if (type === "pdf") { badgeColor = "#e08a8a"; badgeText = "PDF"; }
  else if (type === "application") { badgeColor = "#b89ce0"; badgeText = "APP"; }
  else if (type === "shortcut") { badgeColor = "#8ab8e0"; badgeText = "LNK"; }
  else if (type === "text") { badgeColor = "#c8c8c8"; badgeText = "TXT"; }
  else if (type === "document") { badgeColor = "#8ab8e0"; badgeText = "DOC"; }

  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Page */}
      <path d="M12 6h18l10 10v26a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        fill="rgba(255,255,255,0.08)" stroke={stroke} strokeWidth="1.5" />
      {/* Folded corner */}
      <path d="M30 6l10 10h-10V6z" fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="1.5" />
      {/* Content lines */}
      <line x1="14" y1="22" x2="34" y2="22" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="14" y1="27" x2="34" y2="27" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="14" y1="32" x2="26" y2="32" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* Badge */}
      <rect x="26" y="32" width="16" height="10" rx="2"
        fill={badgeColor} opacity="0.95" />
      <text x="34" y="39.5" textAnchor="middle" fontSize="6" fontWeight="700"
        fill="#0a0e1a" fontFamily="Inter, sans-serif">{badgeText}</text>
    </svg>
  );
}

/* ============================================================
   Sidebar — favorites + storage
   ============================================================ */
function Sidebar({ fs, currentPath, onNavigate, recents, onOpenRecent }) {
  const totalStorage = 256 * 1024 * 1024 * 1024; // 256 GB
  const usedStorage = useMemo(() => {
    let total = 0;
    const walk = (id) => {
      const n = fs[id];
      if (!n) return;
      if (n.type !== "folder" && n.size) total += n.size;
      if (n.children) n.children.forEach(walk);
    };
    Object.keys(fs).forEach((id) => {
      if (fs[id].parent === null) walk(id);
    });
    // Add some baseline so the bar isn't empty
    return total + 18 * 1024 * 1024 * 1024;
  }, [fs]);
  const usedPct = (usedStorage / totalStorage) * 100;

  return (
    <div className="ex-sidebar">
      <div className="ex-sidebar-header">Explorer</div>

      <div className="ex-sidebar-section">
        <div className="ex-sidebar-section-title">Favorites</div>
        {FAVORITES.map((f) => (
          <button
            key={f.id}
            className={`ex-sidebar-item ${currentPath[0] === f.id ? "active" : ""}`}
            onClick={() => onNavigate([f.id])}
          >
            <FileIcon type="folder" size={18} />
            <span>{f.name}</span>
          </button>
        ))}
      </div>

      {recents.length > 0 && (
        <div className="ex-sidebar-section">
          <div className="ex-sidebar-section-title">Recent</div>
          {recents.slice(0, 5).map((id) => {
            const n = fs[id];
            if (!n) return null;
            return (
              <button
                key={id}
                className="ex-sidebar-item"
                onClick={() => onOpenRecent(id)}
                title={n.name}
              >
                <FileIcon type={n.type} name={n.name} size={18} />
                <span className="ex-truncate">{n.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="ex-sidebar-spacer" />

      <div className="ex-storage">
        <div className="ex-storage-header">
          <span>Storage</span>
          <span className="ex-storage-pct">{Math.round(usedPct)}%</span>
        </div>
        <div className="ex-storage-bar">
          <div className="ex-storage-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="ex-storage-text">
          {formatSize(usedStorage)} of {formatSize(totalStorage)}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Toolbar — back/forward, breadcrumb, search, view toggle, sort
   ============================================================ */
function Toolbar({
  canBack, canForward, onBack, onForward,
  path, fs, onCrumbClick,
  search, onSearch,
  view, onViewChange,
  sortBy, onSortChange,
}) {
  return (
    <div className="ex-toolbar">
      <div className="ex-toolbar-nav">
        <button
          className="ex-toolbar-btn"
          onClick={onBack}
          disabled={!canBack}
          title="Back"
          aria-label="Back"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="ex-toolbar-btn"
          onClick={onForward}
          disabled={!canForward}
          title="Forward"
          aria-label="Forward"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="ex-breadcrumb">
        {path.map((id, i) => {
          const node = fs[id];
          if (!node) return null;
          return (
            <span key={i} className="ex-crumb-wrap">
              {i > 0 && <span className="ex-crumb-sep">/</span>}
              <button
                className="ex-crumb"
                onClick={() => onCrumbClick(i)}
              >
                {node.name}
              </button>
            </span>
          );
        })}
      </div>

      <div className="ex-toolbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ex-search-icon">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="ex-search-input"
          placeholder="Search all files..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className="ex-search-clear" onClick={() => onSearch("")} aria-label="Clear">
            ×
          </button>
        )}
      </div>

      <div className="ex-toolbar-controls">
        <select
          className="ex-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          title="Sort by"
        >
          <option value="name">Sort: Name</option>
          <option value="type">Sort: Type</option>
          <option value="size">Sort: Size</option>
        </select>

        <div className="ex-view-toggle">
          <button
            className={`ex-view-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => onViewChange("grid")}
            title="Grid view"
            aria-label="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
            </svg>
          </button>
          <button
            className={`ex-view-btn ${view === "list" ? "active" : ""}`}
            onClick={() => onViewChange("list")}
            title="List view"
            aria-label="List view"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FileList — grid/list rendering with DnD + selection
   ============================================================ */
function FileList({
  items, fs, view, selectedId, renamingId,
  onSelect, onOpen, onContextMenu, onRenameSubmit, onRenameCancel,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  if (items.length === 0) {
    return (
      <div className="ex-empty">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M16 22a4 4 0 0 1 4-4h14l5 5h17a4 4 0 0 1 4 4v29a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V22z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <path d="M28 42h24M28 48h24M28 54h16" stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="ex-empty-title">This folder is empty</div>
        <div className="ex-empty-sub">Right-click to create a new folder or file</div>
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div
        className="ex-grid"
        onContextMenu={(e) => onContextMenu(e, null)}
        onDragOver={(e) => onDragOver(e)}
        onDrop={(e) => onDrop(e, null)}
      >
        {items.map((id) => {
          const node = fs[id];
          if (!node) return null;
          const isRenaming = renamingId === id;
          return (
            <div
              key={id}
              className={`ex-grid-item ${selectedId === id ? "selected" : ""} ${
                node.type === "folder" ? "droppable" : ""
              }`}
              draggable={!isRenaming}
              onDragStart={(e) => onDragStart(e, id)}
              onDragOver={(e) => onDragOver(e)}
              onDrop={(e) => onDrop(e, id)}
              onDragEnd={onDragEnd}
              onClick={(e) => onSelect(e, id)}
              onDoubleClick={() => onOpen(id)}
              onContextMenu={(e) => onContextMenu(e, id)}
            >
              <FileIcon type={node.type} name={node.name} size={48} />
              {isRenaming ? (
                <input
                  className="ex-rename-input"
                  autoFocus
                  defaultValue={node.name}
                  onBlur={(e) => onRenameSubmit(id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameSubmit(id, e.target.value);
                    if (e.key === "Escape") onRenameCancel();
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="ex-grid-name" title={node.name}>{node.name}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <div
      className="ex-list"
      onContextMenu={(e) => onContextMenu(e, null)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, null)}
    >
      <div className="ex-list-header">
        <div className="ex-list-col ex-list-col-name">Name</div>
        <div className="ex-list-col ex-list-col-type">Type</div>
        <div className="ex-list-col ex-list-col-size">Size</div>
        <div className="ex-list-col ex-list-col-modified">Modified</div>
      </div>
      <div className="ex-list-body">
        {items.map((id) => {
          const node = fs[id];
          if (!node) return null;
          const isRenaming = renamingId === id;
          return (
            <div
              key={id}
              className={`ex-list-row ${selectedId === id ? "selected" : ""} ${
                node.type === "folder" ? "droppable" : ""
              }`}
              draggable={!isRenaming}
              onDragStart={(e) => onDragStart(e, id)}
              onDragOver={(e) => onDragOver(e)}
              onDrop={(e) => onDrop(e, id)}
              onDragEnd={onDragEnd}
              onClick={(e) => onSelect(e, id)}
              onDoubleClick={() => onOpen(id)}
              onContextMenu={(e) => onContextMenu(e, id)}
            >
              <div className="ex-list-col ex-list-col-name">
                <FileIcon type={node.type} name={node.name} size={20} />
                {isRenaming ? (
                  <input
                    className="ex-rename-input"
                    autoFocus
                    defaultValue={node.name}
                    onBlur={(e) => onRenameSubmit(id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onRenameSubmit(id, e.target.value);
                      if (e.key === "Escape") onRenameCancel();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="ex-truncate">{node.name}</span>
                )}
              </div>
              <div className="ex-list-col ex-list-col-type">{typeLabel(node.type)}</div>
              <div className="ex-list-col ex-list-col-size">{formatSize(node.size)}</div>
              <div className="ex-list-col ex-list-col-modified">{formatDate(node.modified)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   DetailsPanel
   ============================================================ */
function DetailsPanel({ node, fs, path }) {
  if (!node) {
    return (
      <div className="ex-details">
        <div className="ex-details-header">Details</div>
        <div className="ex-details-empty">
          <div className="ex-details-empty-icon">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <path d="M16 24l6 6 12-12" stroke="rgba(255,255,255,0.25)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>Select a file to view details</div>
        </div>
      </div>
    );
  }

  const location = "/" + path.map((p) => fs[p]?.name).filter(Boolean).join("/");

  return (
    <div className="ex-details">
      <div className="ex-details-header">Details</div>
      <div className="ex-details-preview">
        <FileIcon type={node.type} name={node.name} size={64} />
      </div>
      <div className="ex-details-name" title={node.name}>{node.name}</div>

      <div className="ex-details-rows">
        <div className="ex-details-row">
          <span className="ex-details-label">Type</span>
          <span className="ex-details-value">{typeLabel(node.type)}</span>
        </div>
        <div className="ex-details-row">
          <span className="ex-details-label">Size</span>
          <span className="ex-details-value">{formatSize(node.size)}</span>
        </div>
        <div className="ex-details-row">
          <span className="ex-details-label">Location</span>
          <span className="ex-details-value ex-truncate" title={location}>{location}</span>
        </div>
        <div className="ex-details-row">
          <span className="ex-details-label">Created</span>
          <span className="ex-details-value">{formatDate(node.created)}</span>
        </div>
        <div className="ex-details-row">
          <span className="ex-details-label">Modified</span>
          <span className="ex-details-value">{formatDate(node.modified)}</span>
        </div>
        <div className="ex-details-row">
          <span className="ex-details-label">Status</span>
          <span className="ex-details-value">
            <span className="ex-status-dot" /> Synced
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ContextMenu
   ============================================================ */
function ContextMenu({ x, y, target, onClose, onAction }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (x + rect.width > vw - 8) nx = vw - rect.width - 8;
    if (y + rect.height > vh - 8) ny = vh - rect.height - 8;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const items = target
    ? [
        { label: "Open", action: "open", icon: "open" },
        { label: "Rename", action: "rename", icon: "rename", shortcut: "F2" },
        { label: "Duplicate", action: "duplicate", icon: "duplicate" },
        { divider: true },
        { label: "Delete", action: "delete", icon: "delete", shortcut: "Del", danger: true },
        { divider: true },
        { label: "Properties", action: "properties", icon: "properties" },
      ]
    : [
        { label: "New Folder", action: "newFolder", icon: "folder" },
        { label: "New Note", action: "newNote", icon: "note" },
        { divider: true },
        { label: "Refresh", action: "refresh", icon: "refresh" },
      ];

  return (
    <div
      ref={ref}
      className="ex-context-menu"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="ex-context-divider" />
        ) : (
          <button
            key={i}
            className={`ex-context-item ${item.danger ? "danger" : ""}`}
            onClick={() => { onAction(item.action); onClose(); }}
          >
            <span className="ex-context-label">{item.label}</span>
            {item.shortcut && <span className="ex-context-shortcut">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  );
}

/* ============================================================
   ConfirmModal (delete confirmation)
   ============================================================ */
function ConfirmModal({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <div className="ex-modal-overlay" onClick={onCancel}>
      <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ex-modal-title">{title}</div>
        <div className="ex-modal-message">{message}</div>
        <div className="ex-modal-actions">
          <button className="ex-modal-btn ex-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="ex-modal-btn ex-modal-confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PreviewWindow — opens when double-clicking image/pdf/text
   ============================================================ */
function PreviewWindow({ node, onClose }) {
  if (!node) return null;
  return (
    <div className="ex-preview-overlay" onClick={onClose}>
      <div className="ex-preview" onClick={(e) => e.stopPropagation()}>
        <div className="ex-preview-header">
          <span className="ex-preview-title">{node.name}</span>
          <button className="ex-preview-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ex-preview-body">
          {node.type === "image" && (
            <div className="ex-preview-image-placeholder">
              <FileIcon type="image" name={node.name} size={120} />
              <div className="ex-preview-meta">
                Image preview · {formatSize(node.size)}
              </div>
            </div>
          )}
          {node.type === "pdf" && (
            <div className="ex-preview-pdf-placeholder">
              <FileIcon type="pdf" name={node.name} size={120} />
              <div className="ex-preview-meta">
                PDF Document · {formatSize(node.size)}
              </div>
              <div className="ex-preview-pdf-lines">
                <div /><div /><div /><div /><div /><div />
              </div>
            </div>
          )}
          {node.type === "text" && (
            <div className="ex-preview-text">
              <div className="ex-preview-text-line" />
              <div className="ex-preview-text-line short" />
              <div className="ex-preview-text-line" />
              <div className="ex-preview-text-line" />
              <div className="ex-preview-text-line short" />
              <div className="ex-preview-text-line" />
              <div className="ex-preview-text-line short" />
              <div className="ex-preview-text-line" />
            </div>
          )}
          {(node.type === "document" || node.type === "application" || node.type === "shortcut") && (
            <div className="ex-preview-generic">
              <FileIcon type={node.type} name={node.name} size={120} />
              <div className="ex-preview-meta">
                {typeLabel(node.type)} · {formatSize(node.size)}
              </div>
              <div className="ex-preview-hint">No preview available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Root: Explorer
   ============================================================ */
export default function Explorer() {
  const [fs, setFs] = useState(buildInitialFS);
  const [path, setPath] = useState(["desktop"]); // array of folder IDs
  const [history, setHistory] = useState([["desktop"]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [sortBy, setSortBy] = useState("name");
  const [contextMenu, setContextMenu] = useState(null); // {x, y, target}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [propertiesTarget, setPropertiesTarget] = useState(null);
  const [previewNode, setPreviewNode] = useState(null);
  const [recents, setRecents] = useState([]);
  const [clipboard, setClipboard] = useState(null); // {op: 'copy'|'cut', id}

  const currentFolderId = path[path.length - 1];
  const currentFolder = fs[currentFolderId];

  /* -------- Navigate (with history) -------- */
  const navigate = useCallback((newPath) => {
    setPath(newPath);
    setSelectedId(null);
    setRenamingId(null);
    setSearch("");
    setHistory((h) => {
      const next = h.slice(0, historyIdx + 1);
      next.push(newPath);
      return next;
    });
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const goBack = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setPath(history[historyIdx - 1]);
      setSelectedId(null);
      setRenamingId(null);
    }
  }, [historyIdx, history]);

  const goForward = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setPath(history[historyIdx + 1]);
      setSelectedId(null);
      setRenamingId(null);
    }
  }, [historyIdx, history]);

  const onCrumbClick = useCallback((idx) => {
    navigate(path.slice(0, idx + 1));
  }, [path, navigate]);

  /* -------- Items to display (with search + sort) -------- */
  const items = useMemo(() => {
    // Global search if search term is set
    if (search.trim()) {
      const term = search.toLowerCase();
      const results = [];
      const walk = (id) => {
        const n = fs[id];
        if (!n) return;
        if (id !== "desktop" && id !== "documents" && id !== "downloads" &&
            id !== "projects" && id !== "images" && n.parent !== null) {
          if (n.name.toLowerCase().includes(term)) results.push(id);
        }
        if (n.children) n.children.forEach(walk);
      };
      Object.keys(fs).forEach(walk);
      return sortItems(results, fs, sortBy);
    }
    // Otherwise show current folder's children
    const children = currentFolder?.children || [];
    return sortItems([...children], fs, sortBy);
  }, [fs, currentFolder, search, sortBy]);

  /* -------- Selection -------- */
  const onSelect = useCallback((e, id) => {
    e.stopPropagation();
    setSelectedId(id);
  }, []);

  /* -------- Open file -------- */
  const openFile = useCallback((id) => {
    const node = fs[id];
    if (!node) return;
    if (node.type === "folder") {
      navigate([...path, id]);
      return;
    }
    // Open preview for files
    setPreviewNode(node);
    setRecents((r) => {
      const next = [id, ...r.filter((x) => x !== id)];
      return next.slice(0, 20);
    });
  }, [fs, path, navigate]);

  const onOpenRecent = useCallback((id) => {
    const node = fs[id];
    if (!node) return;
    if (node.type === "folder") {
      // Build path from parent chain
      const newPath = [];
      let cur = id;
      while (cur) {
        newPath.unshift(cur);
        cur = fs[cur]?.parent;
      }
      navigate(newPath);
    } else {
      setPreviewNode(node);
    }
  }, [fs, navigate]);

  /* -------- Context menu -------- */
  const openContextMenu = useCallback((e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetId) setSelectedId(targetId);
    setContextMenu({ x: e.clientX, y: e.clientY, target: targetId });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  /* -------- Create new node -------- */
  const createNew = useCallback((baseName, type) => {
    const parent = currentFolderId;
    // Find unique name
    let name = baseName;
    if (type === "folder") {
      let i = 1;
      while (fs[parent].children.some((cid) => fs[cid]?.name === name)) {
        name = `New Folder ${i++}`;
      }
    } else {
      const ext = getExt(baseName);
      const stem = baseName.slice(0, baseName.length - ext.length - 1);
      let i = 1;
      while (fs[parent].children.some((cid) => fs[cid]?.name === name)) {
        name = `${stem} ${i}.${ext}`;
        i++;
      }
    }
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNode = makeNode(id, name, type, type === "folder" ? 0 : Math.floor(Math.random() * 10000) + 1024, parent, type === "folder" ? [] : undefined);
    setFs((f) => {
      const next = { ...f, [id]: newNode };
      next[parent] = { ...next[parent], children: [...next[parent].children, id] };
      return next;
    });
    setSelectedId(id);
    setRenamingId(id);
  }, [fs, currentFolderId]);

  /* -------- Duplicate -------- */
  const duplicateNode = useCallback((node) => {
    const parent = node.parent;
    const ext = getExt(node.name);
    const stem = node.type === "folder" ? node.name : node.name.slice(0, node.name.length - ext.length - 1);
    let name = node.type === "folder" ? `${node.name} Copy` : `${stem} Copy.${ext}`;
    let i = 2;
    while (fs[parent].children.some((cid) => fs[cid]?.name === name)) {
      name = node.type === "folder"
        ? `${node.name} Copy ${i}`
        : `${stem} Copy ${i}.${ext}`;
      i++;
    }
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNode = makeNode(id, name, node.type, node.size, parent, node.type === "folder" ? [] : undefined);
    setFs((f) => {
      const next = { ...f, [id]: newNode };
      next[parent] = { ...next[parent], children: [...next[parent].children, id] };
      return next;
    });
    setSelectedId(id);
  }, [fs]);

  const onContextAction = useCallback((action) => {
    const node = selectedId ? fs[selectedId] : null;
    switch (action) {
      case "open":
        if (selectedId) openFile(selectedId);
        break;
      case "rename":
        if (selectedId) setRenamingId(selectedId);
        break;
      case "duplicate":
        if (node) duplicateNode(node);
        break;
      case "delete":
        if (node) setDeleteTarget(node);
        break;
      case "properties":
        if (node) setPropertiesTarget(node);
        break;
      case "newFolder":
        createNew("New Folder", "folder");
        break;
      case "newNote":
        createNew("Untitled.txt", "text");
        break;
      case "refresh":
        // Force re-render by toggling state
        setFs((f) => ({ ...f }));
        break;
      default:
        break;
    }
  }, [selectedId, fs, openFile, createNew, duplicateNode]);

  /* -------- Rename -------- */
  const onRenameSubmit = useCallback((id, newName) => {
    const trimmed = newName.trim();
    setRenamingId(null);
    if (!trimmed) return;
    setFs((f) => {
      const node = f[id];
      if (!node) return f;
      // Detect type change based on extension
      const newType = node.type === "folder" ? "folder" : detectType(trimmed);
      return { ...f, [id]: { ...node, name: trimmed, type: newType, modified: Date.now() } };
    });
  }, []);

  const onRenameCancel = useCallback(() => setRenamingId(null), []);

  /* -------- Delete -------- */
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setFs((f) => {
      const next = { ...f };
      // Recursively delete children
      const stack = [id];
      while (stack.length) {
        const cur = stack.pop();
        const node = next[cur];
        if (node?.children) stack.push(...node.children);
        delete next[cur];
      }
      // Remove from parent
      const parent = deleteTarget.parent;
      if (next[parent]) {
        next[parent] = {
          ...next[parent],
          children: next[parent].children.filter((c) => c !== id),
        };
      }
      return next;
    });
    setDeleteTarget(null);
    setSelectedId(null);
  }, [deleteTarget]);

  /* -------- Drag and drop -------- */
  const dragIdRef = useRef(null);

  const onDragStart = useCallback((e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e, dropTargetId) => {
    e.preventDefault();
    e.stopPropagation();
    const dragId = dragIdRef.current;
    if (!dragId) return;
    dragIdRef.current = null;

    // Determine target folder
    let targetFolderId = currentFolderId;
    if (dropTargetId) {
      const target = fs[dropTargetId];
      if (target?.type === "folder") {
        targetFolderId = dropTargetId;
      } else {
        return; // can't drop on a file
      }
    }

    if (dragId === targetFolderId) return;
    // Prevent dropping a folder into itself or its descendants
    let cur = targetFolderId;
    while (cur) {
      if (cur === dragId) return;
      cur = fs[cur]?.parent;
    }

    setFs((f) => {
      const next = { ...f };
      const dragNode = next[dragId];
      if (!dragNode) return f;
      const oldParent = dragNode.parent;
      // Remove from old parent
      if (next[oldParent]) {
        next[oldParent] = {
          ...next[oldParent],
          children: next[oldParent].children.filter((c) => c !== dragId),
        };
      }
      // Add to new parent
      next[dragId] = { ...dragNode, parent: targetFolderId };
      next[targetFolderId] = {
        ...next[targetFolderId],
        children: [...next[targetFolderId].children, dragId],
      };
      return next;
    });
  }, [fs, currentFolderId]);

  const onDragEnd = useCallback(() => {
    dragIdRef.current = null;
  }, []);

  /* -------- Keyboard shortcuts -------- */
  useEffect(() => {
    const onKey = (e) => {
      // Ignore if focus is in an input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Delete" && selectedId) {
        e.preventDefault();
        const node = fs[selectedId];
        if (node) setDeleteTarget(node);
        return;
      }
      if (e.key === "F2" && selectedId) {
        e.preventDefault();
        setRenamingId(selectedId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        // Select all — we just set selectedId to first, true multi-select omitted for simplicity
        if (items.length > 0) setSelectedId(items[0]);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedId) {
        e.preventDefault();
        setClipboard({ op: "copy", id: selectedId });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "x" && selectedId) {
        e.preventDefault();
        setClipboard({ op: "cut", id: selectedId });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboard) {
        e.preventDefault();
        const srcNode = fs[clipboard.id];
        if (!srcNode) return;
        if (clipboard.op === "copy") {
          duplicateNode(srcNode);
        } else {
          // Move: same as DnD into current folder
          if (srcNode.parent !== currentFolderId) {
            setFs((f) => {
              const next = { ...f };
              const oldParent = srcNode.parent;
              if (next[oldParent]) {
                next[oldParent] = {
                  ...next[oldParent],
                  children: next[oldParent].children.filter((c) => c !== srcNode.id),
                };
              }
              next[srcNode.id] = { ...srcNode, parent: currentFolderId };
              next[currentFolderId] = {
                ...next[currentFolderId],
                children: [...next[currentFolderId].children, srcNode.id],
              };
              return next;
            });
          }
        }
        setClipboard(null);
        return;
      }
      if (e.key === "Enter" && selectedId && renamingId !== selectedId) {
        e.preventDefault();
        openFile(selectedId);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, fs, items, clipboard, currentFolderId, renamingId, openFile, duplicateNode]);

  /* -------- Click on empty space deselects -------- */
  const onMainClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selectedNode = selectedId ? fs[selectedId] : null;

  return (
    <div className="explorer" onClick={onMainClick}>
      <Sidebar
        fs={fs}
        currentPath={path}
        onNavigate={navigate}
        recents={recents}
        onOpenRecent={onOpenRecent}
      />

      <div className="ex-main">
        <Toolbar
          canBack={historyIdx > 0}
          canForward={historyIdx < history.length - 1}
          onBack={goBack}
          onForward={goForward}
          path={path}
          fs={fs}
          onCrumbClick={onCrumbClick}
          search={search}
          onSearch={setSearch}
          view={view}
          onViewChange={setView}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="ex-content">
          <FileList
            items={items}
            fs={fs}
            view={view}
            selectedId={selectedId}
            renamingId={renamingId}
            onSelect={onSelect}
            onOpen={openFile}
            onContextMenu={openContextMenu}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        </div>
      </div>

      <DetailsPanel node={selectedNode} fs={fs} path={path} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onClose={closeContextMenu}
          onAction={onContextAction}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete item"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {propertiesTarget && (
        <ConfirmModal
          title="Properties"
          message={`${propertiesTarget.name}\nType: ${typeLabel(propertiesTarget.type)}\nSize: ${formatSize(propertiesTarget.size)}\nCreated: ${formatDate(propertiesTarget.created)}\nModified: ${formatDate(propertiesTarget.modified)}`}
          confirmLabel="Close"
          onConfirm={() => setPropertiesTarget(null)}
          onCancel={() => setPropertiesTarget(null)}
        />
      )}

      {previewNode && (
        <PreviewWindow node={previewNode} onClose={() => setPreviewNode(null)} />
      )}
    </div>
  );
}

/* ============================================================
   Sort helper
   ============================================================ */
function sortItems(ids, fs, sortBy) {
  return ids.sort((a, b) => {
    const na = fs[a];
    const nb = fs[b];
    if (!na || !nb) return 0;
    // Folders first
    if (na.type === "folder" && nb.type !== "folder") return -1;
    if (na.type !== "folder" && nb.type === "folder") return 1;
    if (sortBy === "name") return na.name.localeCompare(nb.name);
    if (sortBy === "type") {
      if (na.type !== nb.type) return na.type.localeCompare(nb.type);
      return na.name.localeCompare(nb.name);
    }
    if (sortBy === "size") {
      return (na.size || 0) - (nb.size || 0);
    }
    return 0;
  });
}
