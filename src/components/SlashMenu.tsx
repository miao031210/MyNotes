/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useLayoutEffect, useRef } from 'react'
import type { BlockType } from '../utils/types'

interface SlashMenuItem { type: BlockType; icon: string; label: string; desc: string }

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
    { type: 'text', icon: '¶', label: '文本', desc: '普通段落' },
    { type: 'h1', icon: 'H1', label: '标题 1', desc: '大标题' },
    { type: 'h2', icon: 'H2', label: '标题 2', desc: '中标题' },
    { type: 'h3', icon: 'H3', label: '标题 3', desc: '小标题' },
    { type: 'todo', icon: '☐', label: '待办', desc: '勾选任务' },
    { type: 'quote', icon: '"', label: '引用', desc: '引用块' },
    { type: 'code', icon: '</>', label: '代码', desc: '代码块' },
]
export const SLASH_MENU_COUNT = SLASH_MENU_ITEMS.length

interface SlashMenuProps {
    open: boolean
    position: { top: number; left: number }
    selectedIndex: number
    onSelect: (type: BlockType) => void
    onClose: () => void
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ open, position, selectedIndex, onSelect, onClose }) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, onClose])

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        // 先按光标位置放在下方
        let top = position.top
        const left = position.left
        el.style.top = `${top}px`
        el.style.left = `${left}px`

        const rect = el.getBoundingClientRect()
        const viewportH = window.innerHeight || document.documentElement.clientHeight
        const margin = 12

        // 如果底部超出视口，则尝试翻到光标上方
        if (rect.bottom > viewportH - margin) {
            const newTop = rect.top - rect.height - 2 * margin
            if (newTop > margin) {
                top = newTop
            } else {
                // 如果上方也不够，就贴近顶部
                top = margin
            }
            el.style.top = `${top}px`
        }
    }, [position, open])

    if (!open) return null

    return (
        <div ref={ref} className="slash-menu">
            {SLASH_MENU_ITEMS.map((item, idx) => (
                <div
                    key={item.type}
                    className={`slash-item${idx === selectedIndex ? ' selected' : ''}`}
                    onMouseDown={e => { e.preventDefault(); onSelect(item.type) }}
                >
                    <div className="slash-icon">{item.icon}</div>
                    <div>
                        <div>{item.label}</div>
                        <div className="slash-desc">{item.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}