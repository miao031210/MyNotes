/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react'

interface ToastItem { id: string; msg: string; color: string }

const listeners: Array<(t: ToastItem) => void> = []

export function showToast(msg: string, color = '#7c3aed'): void {
    const item: ToastItem = { id: Math.random().toString(36).slice(2), msg, color }
    listeners.forEach(fn => fn(item))
}

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    useEffect(() => {
        const push = (t: ToastItem) => {
            setToasts(prev => [...prev, t])
            setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
        }
        listeners.push(push)
        return () => { const i = listeners.indexOf(push); if (i >= 0) listeners.splice(i, 1) }
    }, [])

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className="toast">
                    <span className="toast-dot" />
                    {t.msg}
                </div>
            ))}
        </div>
    )
}