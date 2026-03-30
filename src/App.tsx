import React, { useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useEditorStore } from './store/editorStore'
import { useNotesStore } from './store/notesStore'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { ToastContainer } from './components/Toast'

const App: React.FC = () => {
  const undo = useEditorStore(s => s.undo)
  const redo = useEditorStore(s => s.redo)
  const switchToDoc = useEditorStore(s => s.switchToDoc)
  const { activeDocId, sidebarOpen, switchDoc, loadDoc, persistDoc } = useNotesStore()

  // 挂载时加载当前激活文档
  useEffect(() => {
    const saved = loadDoc(activeDocId)
    switchToDoc(activeDocId, saved, (state, blocks) => persistDoc(activeDocId, state, blocks))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 侧边栏切换文档
  const handleSelectDoc = useCallback((id: string) => {
    switchDoc(id)
    const saved = loadDoc(id)
    switchToDoc(id, saved, (state, blocks) => persistDoc(id, state, blocks))
  }, [switchDoc, loadDoc, switchToDoc, persistDoc])

  return (
    <div id="app">
      <TopBar onUndo={undo} onRedo={redo} />
      <div className={`app-body${sidebarOpen ? ' sidebar-open' : ''}`}>
        <Sidebar onSelectDoc={handleSelectDoc} />
        <main className="main-content">
          {/* 子路由（EditorPage）渲染在这里 */}
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}

export default App