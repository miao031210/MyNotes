import { useRef } from 'react'
import { useEditorStore } from '../../store/editorStore'

export function useDragReorder() {
    const reorderBlock = useEditorStore(s => s.reorderBlock)
    const dragSrcId = useRef<string | null>(null)

    const handleDragStart = (id: string) => (e: React.DragEvent) => {
        dragSrcId.current = id
        e.dataTransfer.effectAllowed = 'move'
        setTimeout(() => { (e.currentTarget as HTMLElement).style.opacity = '0.4' }, 0)
    }
    const handleDragEnd = () => (e: React.DragEvent) => {
        dragSrcId.current = null
            ; (e.currentTarget as HTMLElement).style.opacity = ''
    }
    const handleDragOver = () => (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }
    const handleDrop = (targetId: string, targetIdx: number) => (e: React.DragEvent) => {
        e.preventDefault()
        if (!dragSrcId.current || dragSrcId.current === targetId) return
        reorderBlock(dragSrcId.current, targetIdx)
    }

    return { handleDragStart, handleDragEnd, handleDragOver, handleDrop }
}