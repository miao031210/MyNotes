import { createBrowserRouter, redirect } from 'react-router-dom'
import App from '../App'
import { EditorPage } from '../pages/EditorPage'
import { LoginPage } from '../pages/LoginPage'
import { loadSession } from '../utils/authStorage'

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
        loader: () => {
            const session = loadSession()
            if (session) throw redirect('/')
            return null
        },
    },
    {
        path: '/',
        element: <App />,
        loader: () => {
            const session = loadSession()
            if (!session) throw redirect('/login')
            return null
        },
        children: [
            { index: true, element: <EditorPage /> },
        ],
    },
])