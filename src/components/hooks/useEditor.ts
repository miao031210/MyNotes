import { useCallback, useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { debounce } from '../../utils/debounce'
import { MD_SHORTCUTS } from '../../utils/blockTypes'
import type { BlockType } from '../../utils/types'

export function useEditor() {
    const createBlock = useEditorStore(s => s.createBlock)
    const updateBlock = useEditorStore(s => s.updateBlock)
    const deleteBlock = useEditorStore(s => s.deleteBlock)
    const blocks = useEditorStore(s => s.blocks)

    const debouncedSaves = useRef<Map<string, (content: string) => void>>(new Map())

    const getSave = useCallback((id: string) => {
        if (!debouncedSaves.current.has(id)) {
            debouncedSaves.current.set(id, debounce((content: string) => {
                updateBlock(id, { content })
            }, 150))
        }
        return debouncedSaves.current.get(id)!
    }, [updateBlock])

    const focusBlock = useCallback((id: string, position: 'start' | 'end' = 'end') => {
        requestAnimationFrame(() => {
            const el = document.querySelector<HTMLElement>(`[data-block-id="${id}"] .block-content`)
            if (!el) return
            el.focus()
            const sel = window.getSelection()
            if (!sel) return
            const range = document.createRange()
            range.selectNodeContents(el)
            range.collapse(position === 'start')
            sel.removeAllRanges()
            sel.addRange(range)
        })
    }, [])

    const makeInputHandler = useCallback(
        (id: string, onSlash: (id: string, el: HTMLElement) => void) =>
            (e: React.FormEvent<HTMLDivElement>) => {
                const text = e.currentTarget.textContent ?? ''
                if (text === '/') {
                    onSlash(id, e.currentTarget)
                    // 触发命令菜单时不保留 "/"，避免选择后还要手动删除
                    e.currentTarget.textContent = ''
                    getSave(id)('')
                    return
                }
                getSave(id)(text)
            },
        [getSave],
    )

    const makeKeyDownHandler = useCallback(
        (id: string, closeSlash: () => void, slashOpen: boolean) =>
            (e: React.KeyboardEvent<HTMLDivElement>) => {
                const el = e.currentTarget
                const text = el.textContent ?? ''
                const idx = blocks.findIndex(b => b.id === id)

                if (e.key === 'Enter' && !e.shiftKey && !slashOpen) {
                    e.preventDefault()
                    focusBlock(createBlock(id), 'start')
                    return
                }
                if (e.key === 'Backspace' && text === '') {
                    e.preventDefault()
                    deleteBlock(id)
                    const prev = blocks[idx - 1]
                    if (prev) focusBlock(prev.id, 'end')
                    return
                }
                if (e.key === 'ArrowUp' && !slashOpen) {
                    const sel = window.getSelection()
                    if (sel?.focusOffset === 0) {
                        e.preventDefault()
                        const prev = blocks[idx - 1]
                        if (prev) focusBlock(prev.id, 'end')
                    }
                    return
                }
                if (e.key === 'ArrowDown' && !slashOpen) {
                    const sel = window.getSelection()
                    if (sel && sel.focusOffset >= text.length) {
                        e.preventDefault()
                        const next = blocks[idx + 1]
                        if (next) focusBlock(next.id, 'start')
                    }
                    return
                }
                if (e.key === ' ') {
                    const newType = MD_SHORTCUTS[text] as BlockType | undefined
                    if (newType) {
                        e.preventDefault()
                        updateBlock(id, { type: newType, content: '' })
                        focusBlock(id, 'start')
                    }
                }
                if (e.key === 'Escape') closeSlash()
            },
        [blocks, createBlock, deleteBlock, updateBlock, focusBlock],
    )

    return { makeInputHandler, makeKeyDownHandler, focusBlock }
}