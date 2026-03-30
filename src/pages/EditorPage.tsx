import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { BlockRow } from '../components/BlockRow'
import { SlashMenu, SLASH_MENU_COUNT, SLASH_MENU_ITEMS } from '../components/SlashMenu'
import type { BlockType } from '../utils/types'

export const EditorPage: React.FC = () => {
    const blocks = useEditorStore(s => s.blocks)
    const updateBlock = useEditorStore(s => s.updateBlock)
    const undo = useEditorStore(s => s.undo)
    const redo = useEditorStore(s => s.redo)

    const [slashOpen, setSlashOpen] = useState(false)
    const [slashTarget, setSlashTarget] = useState<string | null>(null)
    const [slashPos, setSlashPos] = useState({ top: 0, left: 0 })
    const [slashIdx, setSlashIdx] = useState(0)

    const openSlash = useCallback((blockId: string, el: HTMLElement) => {
        const rect = el.getBoundingClientRect()
        setSlashTarget(blockId); setSlashPos({ top: rect.bottom + 6, left: rect.left })
        setSlashIdx(0); setSlashOpen(true)
    }, [])

    const closeSlash = useCallback(() => { setSlashOpen(false); setSlashTarget(null) }, [])

    const selectSlash = useCallback((type: BlockType) => {
        if (slashTarget) {
            updateBlock(slashTarget, { type, content: '' })
            requestAnimationFrame(() => {
                document.querySelector<HTMLElement>(`[data-block-id="${slashTarget}"] .block-content`)?.focus()
            })
        }
        closeSlash()
    }, [slashTarget, updateBlock, closeSlash])

    const slashSelectRef = useRef<(idx: number) => void>(() => { })
    useEffect(() => {
        slashSelectRef.current = (idx: number) => {
            const item = SLASH_MENU_ITEMS[idx]
            if (item) selectSlash(item.type)
        }
    }, [selectSlash])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
            if (!slashOpen) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(i => (i + 1) % SLASH_MENU_COUNT) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(i => (i - 1 + SLASH_MENU_COUNT) % SLASH_MENU_COUNT) }
            else if (e.key === 'Enter') { e.preventDefault(); slashSelectRef.current?.(slashIdx) }
            else if (e.key === 'Escape') closeSlash()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [slashOpen, slashIdx, undo, redo, closeSlash])

    return (
        <div className="editor-wrap">
            <div className="editor">
                {blocks.map((block, index) => (
                    <BlockRow
                        key={block.id} block={block} index={index}
                        slashMenuOpen={slashOpen && slashTarget === block.id}
                        onSlashOpen={openSlash} onSlashClose={closeSlash}
                    />
                ))}
                {blocks.length === 0 && (
                    <div className="editor-empty-hint">开始写作… 或输入 <kbd>/</kbd> 打开命令</div>
                )}
            </div>
            <SlashMenu open={slashOpen} position={slashPos} selectedIndex={slashIdx} onSelect={selectSlash} onClose={closeSlash} />
        </div>
    )
}