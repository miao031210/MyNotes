import React, { useState, useRef, useEffect } from 'react'
import { useNotesStore } from '../store/notesStore'
import type { NoteDoc } from '../utils/types'

function formatDate(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 86400000)
  if (diff === 0) return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff === 1) return '昨天'
  if (diff < 7) return `${diff}天前`
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const NoteItem: React.FC<{
  doc: NoteDoc; isActive: boolean
  onSelect: () => void; onDelete: () => void; onToggleFav: () => void
}> = ({ doc, isActive, onSelect, onDelete, onToggleFav }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [menuOpen])

  return (
    <div className={`note-item${isActive ? ' active' : ''}`} onClick={onSelect}>
      <div className="note-item-header">
        <span className="note-item-title">{doc.title}</span>
        <div className="note-item-actions" onClick={e => e.stopPropagation()}>
          <button className={`note-fav-btn${doc.isFavorite ? ' active' : ''}`} onClick={onToggleFav}>
            {doc.isFavorite ? '★' : '☆'}
          </button>
          <button className="note-menu-btn" onClick={() => setMenuOpen(v => !v)}>···</button>
          {menuOpen && (
            <div ref={menuRef} className="note-ctx-menu">
              <button className="note-ctx-item danger" onClick={() => { setMenuOpen(false); onDelete() }}>
                删除笔记
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="note-item-meta">
        <span className="note-item-date">{formatDate(doc.updatedAt)}</span>
        {doc.blockCount > 0 && <span className="note-item-count">{doc.blockCount} 行</span>}
      </div>
      {doc.preview && <div className="note-item-preview">{doc.preview}</div>}
    </div>
  )
}

interface SidebarProps { onSelectDoc: (id: string) => void }

export const Sidebar: React.FC<SidebarProps> = ({ onSelectDoc }) => {
  const { docs, activeDocId, sidebarOpen, createDoc, deleteDoc, toggleFavorite } = useNotesStore()
  const [search, setSearch] = useState('')

  const filtered = docs.filter(d => d.title.includes(search) || d.preview.includes(search))
  const favorites = filtered.filter(d => d.isFavorite)
  const recents = filtered.filter(d => !d.isFavorite)

  const handleCreate = () => onSelectDoc(createDoc())

  const handleDelete = (id: string) => {
    deleteDoc(id)
    onSelectDoc(useNotesStore.getState().activeDocId)
  }

  return (
    <>
      <button type="button" className="sidebar-toggle" style={{ display: 'none' }} />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">笔记</span>
          <button className="sidebar-new-btn" onClick={handleCreate} title="新建笔记">+</button>
        </div>
        <div className="sidebar-search-wrap">
          <input
            className="sidebar-search"
            placeholder="搜索笔记…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sidebar-list">
          {favorites.length > 0 && (
            <>
              <div className="sidebar-section-label">收藏</div>
              {favorites.map(doc => (
                <NoteItem
                  key={doc.id} doc={doc} isActive={doc.id === activeDocId}
                  onSelect={() => doc.id !== activeDocId && onSelectDoc(doc.id)}
                  onDelete={() => handleDelete(doc.id)}
                  onToggleFav={() => toggleFavorite(doc.id)}
                />
              ))}
            </>
          )}
          {recents.length > 0 && (
            <>
              {favorites.length > 0 && <div className="sidebar-section-label">最近</div>}
              {recents.map(doc => (
                <NoteItem
                  key={doc.id} doc={doc} isActive={doc.id === activeDocId}
                  onSelect={() => doc.id !== activeDocId && onSelectDoc(doc.id)}
                  onDelete={() => handleDelete(doc.id)}
                  onToggleFav={() => toggleFavorite(doc.id)}
                />
              ))}
            </>
          )}
          {filtered.length === 0 && (
            <div className="sidebar-empty">{search ? '未找到笔记' : '还没有笔记'}</div>
          )}
        </div>
      </aside>
    </>
  )
}