import React from 'react'
import { useEditorStore } from '../store/editorStore'
import { useNotesStore } from '../store/notesStore'
import { useAuthStore } from '../store/authStore'

interface TopBarProps { onUndo: () => void; onRedo: () => void }

export const TopBar: React.FC<TopBarProps> = ({ onUndo, onRedo }) => {
    const canUndo = useEditorStore(s => s.canUndo)
    const canRedo = useEditorStore(s => s.canRedo)
    const myColor = useEditorStore(s => s.myColor)
    const myShort = useEditorStore(s => s.myShort)
    const myName = useEditorStore(s => s.myName)
    const { docs, activeDocId, toggleSidebar, sidebarOpen } = useNotesStore()
    const authUser = useAuthStore(s => s.user)
    const logout = useAuthStore(s => s.logout)
    const docTitle = docs.find(d => d.id === activeDocId)?.title || '无标题'
    const loginName = authUser?.username?.trim() || myName
    const loginShort = (authUser?.username?.trim()?.[0] || myShort).toUpperCase()

    return (
        <header className="topbar">
            <button className={`icon-btn sidebar-toggle-btn${sidebarOpen ? ' active' : ''}`} onClick={toggleSidebar}>☰</button>
            <span className="logo">✦ MyNotes</span>
            <span className="topbar-divider" />
            <span className="doc-title" title={docTitle}>{docTitle}</span>
            <span className="sep" />
            <button className="icon-btn" onClick={onUndo} disabled={!canUndo} title="撤销 Ctrl+Z">↩</button>
            <button className="icon-btn" onClick={onRedo} disabled={!canRedo} title="重做 Ctrl+Y">↪</button>

            <div className="presence">
                <div className="avatar" style={{ background: myColor }}>
                    {loginShort}
                    <span className="avatar-tooltip">{loginName}</span>
                </div>
            </div>

            <span className="topbar-divider" />
            <button className="topbar-logout" onClick={logout} title="退出登录">
                退出
            </button>
        </header>
    )
}