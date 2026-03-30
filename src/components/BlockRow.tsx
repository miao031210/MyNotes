import React, { useRef, memo, useLayoutEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useEditor } from './hooks/useEditor'
import { useDragReorder } from './hooks/useCursor'
import { BLOCK_TYPES } from '../utils/blockTypes'
import type { Block } from '../utils/types'

interface BlockRowProps {
    block: Block
    index: number
    slashMenuOpen: boolean
    onSlashOpen: (blockId: string, el: HTMLElement) => void
    onSlashClose: () => void
}

export const BlockRow: React.FC<BlockRowProps> = memo(({
    block, index, slashMenuOpen, onSlashOpen, onSlashClose,
}) => {
    const contentRef = useRef<HTMLDivElement>(null)
    const updateBlock = useEditorStore(s => s.updateBlock)
    const { makeInputHandler, makeKeyDownHandler } = useEditor()
    const { handleDragStart, handleDragEnd, handleDragOver, handleDrop } = useDragReorder()

    // contentEditable 不用 value 控制，用 ref 直接写 DOM，避免光标跳位
    useLayoutEffect(() => {
        const el = contentRef.current
        if (el && document.activeElement !== el && el.textContent !== block.content) {
            el.textContent = block.content
        }
    }, [block.content])

    return (
        <div
            className="block-row"
            data-block-id={block.id}
            draggable
            onDragStart={handleDragStart(block.id)}
            onDragEnd={handleDragEnd()}
            onDragOver={handleDragOver()}
            onDrop={handleDrop(block.id, index)}
        >
            {/* 拖拽手柄 */}
            <div className="drag-handle">⠿</div>

            {/* todo 勾选框 */}
            {block.type === 'todo' && (
                <div
                    className={`todo-check${block.done ? ' checked' : ''}`}
                    onClick={() => updateBlock(block.id, { done: !block.done })}
                    role="checkbox"
                    aria-checked={block.done}
                />
            )}

            {/* 类型图标占位（非 todo） */}
            {block.type !== 'todo' && <div className="block-type-icon" />}

            {/* 可编辑内容区 */}
            <div
                ref={contentRef}
                className={`block-content${block.type === 'todo' && block.done ? ' done' : ''}`}
                contentEditable
                suppressContentEditableWarning
                spellCheck
                data-btype={block.type}
                data-placeholder={BLOCK_TYPES[block.type]?.placeholder ?? '写点什么…'}
                onInput={makeInputHandler(block.id, onSlashOpen)}
                onKeyDown={makeKeyDownHandler(block.id, onSlashClose, slashMenuOpen)}
            />
        </div>
    )
})

BlockRow.displayName = 'BlockRow'