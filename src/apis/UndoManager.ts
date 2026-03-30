import type { Op, UndoOp, DeleteOp } from '../utils/types'
import type { CRDTDoc } from './CRDTDoc'

type RenderFn = () => void
type BroadcastFn = () => void

/**
 * UndoManager —— 协同兼容的 Undo/Redo
 *
 * 只撤销本地操作，不撤销远端 op，保证协同一致性
 */
export class UndoManager {
    private undoStack: Op[] = []
    private redoStack: Op[] = []
    private doc: CRDTDoc
    private render: RenderFn
    private broadcast: BroadcastFn

    constructor(doc: CRDTDoc, render: RenderFn, broadcast: BroadcastFn) {
        this.doc = doc
        this.render = render
        this.broadcast = broadcast
    }

    get canUndo(): boolean { return this.undoStack.length > 0 }
    get canRedo(): boolean { return this.redoStack.length > 0 }

    push(op: Op): void {
        this.undoStack.push(op)
        this.redoStack = []
    }

    undo(): void {
        const op = this.undoStack.pop()
        if (!op) return
        const rev = this.reverse(op)
        if (rev) {
            this.redoStack.push(op)
            this.applyUndoOp(rev)
        }
    }

    redo(): void {
        const op = this.redoStack.pop()
        if (!op) return
        this.undoStack.push(op)
        this.reapply(op)
    }

    private reverse(op: Op): UndoOp | null {
        if (op.kind === 'update')
            return { ...op, patch: op.prev, prev: { ...op.prev, ...op.patch }, _undo: true }
        if (op.kind === 'delete')
            return { kind: '_restore', op } as UndoOp
        if (op.kind === 'create')
            return { kind: '_uncreate', id: op.block.id } as UndoOp
        if (op.kind === 'reorder')
            return { kind: 'reorder', id: op.id, newIdx: op.prevOrder.indexOf(op.id), prevOrder: [...this.doc.order], vclock: op.vclock }
        return null
    }

    private applyUndoOp(rev: UndoOp): void {
        if (rev.kind === 'update') {
            const cur = this.doc.blocks.get(rev.id)
            if (cur) this.doc.blocks.set(rev.id, { ...cur, ...rev.patch })
        } else if (rev.kind === '_restore') {
            const { op } = rev as { kind: '_restore'; op: DeleteOp }
            this.doc.deleted.delete(op.id)
            this.doc.order.splice(Math.min(op.prevIdx, this.doc.order.length), 0, op.id)
        } else if (rev.kind === '_uncreate') {
            this.doc.deleted.add(rev.id)
            this.doc.order = this.doc.order.filter(x => x !== rev.id)
        } else if (rev.kind === 'reorder') {
            const cur = this.doc.order.indexOf(rev.id)
            if (cur >= 0) {
                this.doc.order.splice(cur, 1)
                this.doc.order.splice(Math.min(rev.newIdx, this.doc.order.length), 0, rev.id)
            }
        }
        this.render()
        this.broadcast()
    }

    private reapply(op: Op): void {
        if (op.kind === 'update') {
            const cur = this.doc.blocks.get(op.id)
            if (cur) this.doc.blocks.set(op.id, { ...cur, ...op.patch })
        } else if (op.kind === 'delete') {
            this.doc.deleted.add(op.id)
            this.doc.order = this.doc.order.filter(x => x !== op.id)
        } else if (op.kind === 'create') {
            this.doc.deleted.delete(op.block.id)
            if (!this.doc.order.includes(op.block.id)) {
                const afterIdx = op.afterId ? this.doc.order.indexOf(op.afterId) : -1
                if (afterIdx >= 0) this.doc.order.splice(afterIdx + 1, 0, op.block.id)
                else this.doc.order.push(op.block.id)
            }
        } else if (op.kind === 'reorder') {
            const cur = this.doc.order.indexOf(op.id)
            if (cur >= 0) {
                this.doc.order.splice(cur, 1)
                this.doc.order.splice(Math.min(op.newIdx, this.doc.order.length), 0, op.id)
            }
        }
        this.render()
        this.broadcast()
    }
}