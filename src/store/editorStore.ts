import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { CRDTDoc } from '../apis/CRDTDoc'
import { UndoManager } from '../apis/UndoManager'
import { debounce } from '../utils/debounce'
import { getOrCreateUserId, getUserColor, getUserName, getUserShort } from '../utils/userIdentity'
import type { Block, BlockType, SerializedDoc } from '../utils/types'

const myId = getOrCreateUserId()
const myColor = getUserColor(myId)
const myName = getUserName(myId)
const myShort = getUserShort(myName)

// ─── Session：一个文档的完整协同会话 ──────────────────────────
interface Session {
    doc: CRDTDoc
    undoMgr: UndoManager
    cleanup: () => void
}

function createSession(
    _docId: string,
    savedState: SerializedDoc | null,
    onPersist: (state: SerializedDoc, blocks: Block[]) => void,
    callbacks: {
        refreshBlocks: () => void
        setUndoState: (canUndo: boolean, canRedo: boolean) => void
    },
): Session {
    const doc = new CRDTDoc()

    if (savedState?.order?.length) doc.hydrate(savedState)

    const { refreshBlocks, setUndoState } = callbacks
    const refresh = () => refreshBlocks()

    const undoMgr = new UndoManager(
        doc,
        () => { refresh(); setUndoState(undoMgr.canUndo, undoMgr.canRedo) },
        () => { /* no-op: local-only mode */ },
    )

    const autoSave = debounce(() => onPersist(doc.serialize(), doc.getBlocks()), 1000)
    const unsubOp = doc.subscribe((op) => {
        undoMgr.push(op)
        setUndoState(undoMgr.canUndo, undoMgr.canRedo)
        autoSave()
    })

    // 新文档：种入初始内容
    if (!savedState?.order?.length) {
        setTimeout(() => {
            if (!doc.getBlocks().length) {
                const id1 = doc.localCreate({ type: 'h1', content: '无标题', authorId: myId })
                doc.localCreate({ type: 'text', content: '', afterId: id1, authorId: myId })
            }
            refresh()
        }, 300)
    }

    return { doc, undoMgr, cleanup: () => { unsubOp() } }
}

// ─── Store 类型 ────────────────────────────────────────────────
interface EditorState {
    blocks: Block[]
    canUndo: boolean
    canRedo: boolean
    docId: string
    myId: string; myColor: string; myName: string; myShort: string

    createBlock: (afterId: string | null, type?: BlockType) => string
    updateBlock: (id: string, patch: Partial<Block>) => void
    deleteBlock: (id: string) => void
    reorderBlock: (id: string, newIdx: number) => void
    undo: () => void
    redo: () => void
    switchToDoc: (newDocId: string, savedState: SerializedDoc | null, onPersist: (state: SerializedDoc, blocks: Block[]) => void) => void
}

let session: Session | null = null

export const useEditorStore = create<EditorState>()(
    subscribeWithSelector((set) => {
        const refreshBlocks = () => {
            if (!session) return
            set({ blocks: session.doc.getBlocks() })
        }
        let currentUndoState = { canUndo: false, canRedo: false }
        const setUndoState = (canUndo: boolean, canRedo: boolean) => {
            if (currentUndoState.canUndo === canUndo && currentUndoState.canRedo === canRedo) return
            currentUndoState = { canUndo, canRedo }
            set({ canUndo, canRedo })
        }

        const makeSession = (
            docId: string,
            savedState: SerializedDoc | null,
            onPersist: (state: SerializedDoc, blocks: Block[]) => void,
        ) => {
            session?.cleanup()
            session = createSession(docId, savedState, onPersist, { refreshBlocks, setUndoState })
            set({ docId, blocks: session.doc.getBlocks(), canUndo: false, canRedo: false })
        }

        return {
            blocks: [], canUndo: false, canRedo: false, docId: '',
            myId, myColor, myName, myShort,

            createBlock(afterId, type = 'text') {
                if (!session) return ''
                const id = session.doc.localCreate({ type, afterId, authorId: myId })
                refreshBlocks()
                return id
            },
            updateBlock(id, patch) {
                if (!session) return
                session.doc.localUpdate(id, patch, myId)
                refreshBlocks()
            },
            deleteBlock(id) {
                if (!session) return
                session.doc.localDelete(id)
                refreshBlocks()
            },
            reorderBlock(id, newIdx) {
                if (!session) return
                session.doc.localReorder(id, newIdx)
                refreshBlocks()
            },
            undo() { session?.undoMgr.undo(); setUndoState(session?.undoMgr.canUndo ?? false, session?.undoMgr.canRedo ?? false) },
            redo() { session?.undoMgr.redo(); setUndoState(session?.undoMgr.canUndo ?? false, session?.undoMgr.canRedo ?? false) },
            switchToDoc: makeSession,
        }
    }),
)