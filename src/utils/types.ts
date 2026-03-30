// ─── Block ────────────────────────────────────────────────────
export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'quote' | 'code'

export interface Block {
    id: string
    type: BlockType
    content: string
    done: boolean
    vclock: number
    authorId: string
    lastEditor: string
}

// ─── CRDT 操作类型 ─────────────────────────────────────────────
export interface CreateOp {
    kind: 'create'
    block: Block
    afterId: string | null
    vclock: number
}

export interface UpdateOp {
    kind: 'update'
    id: string
    patch: Partial<Block>
    prev: Block
    vclock: number
    _undo?: boolean
}

export interface DeleteOp {
    kind: 'delete'
    id: string
    prev: Block
    prevIdx: number
    vclock: number
}

export interface ReorderOp {
    kind: 'reorder'
    id: string
    newIdx: number
    prevOrder: string[]
    vclock: number
}

export interface RestoreOp {
    kind: '_restore'
    op: DeleteOp
}

export interface UncreateOp {
    kind: '_uncreate'
    id: string
}

export type Op = CreateOp | UpdateOp | DeleteOp | ReorderOp
export type UndoOp = Op | RestoreOp | UncreateOp

// ─── 文档序列化结构 ────────────────────────────────────────────
export interface SerializedDoc {
    blocks: [string, Block][]
    order: string[]
    deleted: string[]
    clock: number
}

// ─── Block 类型元数据 ──────────────────────────────────────────
export interface BlockTypeMeta {
    placeholder: string
    icon: string
}

export type BlockTypeMap = Record<BlockType, BlockTypeMeta>

// ─── 笔记文档（侧边栏用）─────────────────────────────────────
export interface NoteDoc {
    id: string
    title: string
    preview: string
    createdAt: number
    updatedAt: number
    isFavorite: boolean
    blockCount: number
}