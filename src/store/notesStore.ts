import { create } from 'zustand'
import { uid } from '../utils/idGenerator'
import type { NoteDoc, SerializedDoc, Block } from '../utils/types'

// ─── localStorage key 规范 ─────────────────────────────────────
const NOTES_INDEX_KEY = 'mynotes_index'
const NOTES_INDEX_KEY_LEGACY = 'collabnotes_index'

const docKey = (id: string) => `mynotes_doc_${id}`
const docKeyLegacy = (id: string) => `collabnotes_doc_${id}`

// ─── 读写工具 ──────────────────────────────────────────────────
function loadIndex(): NoteDoc[] {
    try {
        const raw = localStorage.getItem(NOTES_INDEX_KEY)
        return raw ? (JSON.parse(raw) as NoteDoc[]) : []
    } catch (error) { console.warn('loadIndex error', error); }

    // 兼容旧 key，避免改名后本地笔记丢失
    try {
        const raw = localStorage.getItem(NOTES_INDEX_KEY_LEGACY)
        if (!raw) return []
        const docs = JSON.parse(raw) as NoteDoc[]
        localStorage.setItem(NOTES_INDEX_KEY, JSON.stringify(docs))
        return docs
    } catch (error) { console.warn('loadIndex legacy error', error); return [] }
}
function saveIndex(docs: NoteDoc[]): void {
    try { localStorage.setItem(NOTES_INDEX_KEY, JSON.stringify(docs)) } catch (error) { console.warn('saveIndex error', error) }
}
function loadDocState(id: string): SerializedDoc | null {
    try {
        const raw = localStorage.getItem(docKey(id))
        return raw ? (JSON.parse(raw) as SerializedDoc) : null
    } catch (error) { console.warn('loadDocState error', error); }

    // 兼容旧 key
    try {
        const raw = localStorage.getItem(docKeyLegacy(id))
        if (!raw) return null
        const state = JSON.parse(raw) as SerializedDoc
        localStorage.setItem(docKey(id), JSON.stringify(state))
        return state
    } catch (error) { console.warn('loadDocState legacy error', error); return null }
}
function saveDocState(id: string, state: SerializedDoc): void {
    try { localStorage.setItem(docKey(id), JSON.stringify(state)) } catch (error) { console.warn('saveDocState error', error) }
}
function deleteDocState(id: string): void {
    try { localStorage.removeItem(docKey(id)) } catch (error) { console.warn('deleteDocState error', error) }
    try { localStorage.removeItem(docKeyLegacy(id)) } catch { /* ignore */ }
}

// ─── 从 blocks 派生文档元数据 ──────────────────────────────────
export function deriveDocMeta(blocks: Block[]): Pick<NoteDoc, 'title' | 'preview' | 'blockCount'> {
    const live = blocks.filter(b => b.content.trim() !== '')
    const titleBlock = live.find(b => ['h1', 'h2', 'h3'].includes(b.type)) ?? live[0]
    const title = titleBlock?.content.trim().slice(0, 60) || '无标题'
    const preview = live.filter(b => b !== titleBlock).map(b => b.content.trim()).join(' ').slice(0, 90)
    return { title, preview, blockCount: blocks.length }
}

// ─── Store 类型 ────────────────────────────────────────────────
interface NotesState {
    docs: NoteDoc[]
    activeDocId: string
    sidebarOpen: boolean
    createDoc: () => string
    switchDoc: (id: string) => void
    deleteDoc: (id: string) => void
    toggleFavorite: (id: string) => void
    toggleSidebar: () => void
    persistDoc: (id: string, state: SerializedDoc, blocks: Block[]) => void
    loadDoc: (id: string) => SerializedDoc | null
}

// ─── Store 实例 ────────────────────────────────────────────────
export const useNotesStore = create<NotesState>((set, get) => {
    let docs = loadIndex()
    let activeDocId: string

    if (docs.length === 0) {
        const id = uid()
        const now = Date.now()
        docs = [{ id, title: '无标题', preview: '', createdAt: now, updatedAt: now, isFavorite: false, blockCount: 0 }]
        saveIndex(docs)
        activeDocId = id
    } else {
        activeDocId = [...docs].sort((a, b) => b.updatedAt - a.updatedAt)[0].id
    }

    return {
        docs,
        activeDocId,
        sidebarOpen: true,

        createDoc() {
            const id = uid()
            const now = Date.now()
            const doc: NoteDoc = { id, title: '无标题', preview: '', createdAt: now, updatedAt: now, isFavorite: false, blockCount: 0 }
            const next = [doc, ...get().docs]
            saveIndex(next)
            set({ docs: next, activeDocId: id })
            return id
        },

        switchDoc(id) { set({ activeDocId: id }) },

        deleteDoc(id) {
            const { docs, activeDocId, createDoc } = get()
            const next = docs.filter(d => d.id !== id)
            deleteDocState(id)
            if (next.length === 0) { saveIndex(next); set({ docs: next }); createDoc(); return }
            saveIndex(next)
            const newActive = activeDocId === id ? [...next].sort((a, b) => b.updatedAt - a.updatedAt)[0].id : activeDocId
            set({ docs: next, activeDocId: newActive })
        },

        toggleFavorite(id) {
            const next = get().docs.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d)
            saveIndex(next)
            set({ docs: next })
        },

        toggleSidebar() { set(s => ({ sidebarOpen: !s.sidebarOpen })) },

        persistDoc(id, state, blocks) {
            saveDocState(id, state)
            const meta = deriveDocMeta(blocks)
            const next = get().docs.map(d => d.id === id ? { ...d, ...meta, updatedAt: Date.now() } : d)
            const sorted = [
                ...next.filter(d => d.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt),
                ...next.filter(d => !d.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt),
            ]
            saveIndex(sorted)
            set({ docs: sorted })
        },

        loadDoc: (id) => loadDocState(id),
    }
})