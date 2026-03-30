import { uid } from '../utils/idGenerator'
import type {
    Block, BlockType, Op, CreateOp, UpdateOp, DeleteOp, ReorderOp,
    SerializedDoc,
} from '../utils/types'

type OpListener = (op: Op) => void

/**
 * CRDTDoc —— 简化版 CRDT 文档模型
 *
 * 冲突解决策略：
 *  - block 内容：Lamport 时钟 + Last-Write-Wins
 *  - 列表顺序：afterId 前驱锚定（简化 RGA）
 *  - 删除：tombstone，幂等
 */
export class CRDTDoc {
    blocks = new Map<string, Block>()
    order: string[] = []
    deleted = new Set<string>()
    clock = 0
    ops: Op[] = []

    private listeners: OpListener[] = []

    // ── 时钟 ──────────────────────────────────────────────
    private tick(): number { return ++this.clock }

    // ── 订阅/发布 ─────────────────────────────────────────
    subscribe(fn: OpListener): () => void {
        this.listeners.push(fn)
        return () => { this.listeners = this.listeners.filter(l => l !== fn) }
    }
    private emit(op: Op): void { this.listeners.forEach(fn => fn(op)) }

    // ── LWW 合并键 ────────────────────────────────────────
    private mergeKey(block: Block): string {
        return String(block.vclock).padStart(12, '0') + '_' + block.authorId
    }

    // ── 读取 ──────────────────────────────────────────────
    getBlocks(): Block[] {
        return this.order
            .filter(id => !this.deleted.has(id) && this.blocks.has(id))
            .map(id => this.blocks.get(id)!)
    }

    // ── 本地写操作 ────────────────────────────────────────

    localCreate(params: {
        type?: BlockType; content?: string
        afterId?: string | null; authorId: string
    }): string {
        const { type = 'text', content = '', afterId = null, authorId } = params
        const id = uid()
        const vclock = this.tick()
        const block: Block = { id, type, content, done: false, vclock, authorId, lastEditor: authorId }
        this.blocks.set(id, block)

        const afterIdx = afterId ? this.order.indexOf(afterId) : -1
        if (afterIdx >= 0) this.order.splice(afterIdx + 1, 0, id)
        else this.order.push(id)

        const op: CreateOp = { kind: 'create', block, afterId, vclock }
        this.ops.push(op)
        this.emit(op)
        return id
    }

    localUpdate(id: string, patch: Partial<Block>, authorId: string): void {
        if (!this.blocks.has(id) || this.deleted.has(id)) return
        const prev = { ...this.blocks.get(id)! }
        const vclock = this.tick()
        this.blocks.set(id, { ...prev, ...patch, vclock, authorId, lastEditor: authorId })

        const op: UpdateOp = { kind: 'update', id, patch, prev, vclock }
        this.ops.push(op)
        this.emit(op)
    }

    localDelete(id: string): void {
        if (!this.blocks.has(id) || this.deleted.has(id)) return
        const prev = this.blocks.get(id)!
        const prevIdx = this.order.indexOf(id)
        this.deleted.add(id)
        this.order = this.order.filter(x => x !== id)

        const vclock = this.tick()
        const op: DeleteOp = { kind: 'delete', id, prev, prevIdx, vclock }
        this.ops.push(op)
        this.emit(op)
    }

    localReorder(id: string, newIdx: number): void {
        const oldIdx = this.order.indexOf(id)
        if (oldIdx < 0) return
        const arr = [...this.order]
        arr.splice(oldIdx, 1)
        arr.splice(newIdx, 0, id)
        const prevOrder = [...this.order]
        this.order = arr

        const vclock = this.tick()
        const op: ReorderOp = { kind: 'reorder', id, newIdx, prevOrder, vclock }
        this.ops.push(op)
        this.emit(op)
    }

    // ── 远端合并（CRDT 核心）─────────────────────────────

    remoteApply(op: Op): void {
        this.clock = Math.max(this.clock, op.vclock ?? 0)

        if (op.kind === 'create') {
            const { block, afterId } = op
            if (this.blocks.has(block.id)) {
                const local = this.blocks.get(block.id)!
                if (this.mergeKey(block) > this.mergeKey(local))
                    this.blocks.set(block.id, block)
            } else {
                this.blocks.set(block.id, block)
                if (!this.order.includes(block.id)) {
                    const afterIdx = afterId ? this.order.indexOf(afterId) : -1
                    if (afterIdx >= 0) this.order.splice(afterIdx + 1, 0, block.id)
                    else this.order.push(block.id)
                }
            }
            return
        }

        if (op.kind === 'update') {
            const local = this.blocks.get(op.id)
            if (!local) return
            const remoteKey = String(op.vclock).padStart(12, '0') + '_' + (op.patch.authorId ?? '')
            if (remoteKey >= this.mergeKey(local))
                this.blocks.set(op.id, { ...local, ...op.patch, vclock: op.vclock })
            return
        }

        if (op.kind === 'delete') {
            this.deleted.add(op.id)
            this.order = this.order.filter(x => x !== op.id)
            return
        }

        if (op.kind === 'reorder') {
            if (!op.prevOrder) return
            const cur = this.order.indexOf(op.id)
            if (cur >= 0) {
                this.order.splice(cur, 1)
                this.order.splice(Math.min(op.newIdx, this.order.length), 0, op.id)
            }
            return
        }
    }

    // ── 序列化 / 反序列化 ─────────────────────────────────

    serialize(): SerializedDoc {
        return {
            blocks: Array.from(this.blocks.entries()),
            order: [...this.order],
            deleted: Array.from(this.deleted),
            clock: this.clock,
        }
    }

    hydrate(state: SerializedDoc): void {
        this.blocks = new Map(state.blocks)
        this.order = [...state.order]
        this.deleted = new Set(state.deleted)
        this.clock = Math.max(this.clock, state.clock)
    }
}