import { uid } from './idGenerator'

// 颜色池和名字池
const USER_COLORS = [
    '#7c3aed', '#2563eb', '#059669', '#d97706',
    '#dc2626', '#0891b2', '#9333ea', '#be185d', '#047857',
]

function hashStr(s: string): number {
    return parseInt(s.slice(0, 4), 36) || 0
}

/** 从 sessionStorage 读取或新建用户 ID，页面刷新后保持不变 */
export function getOrCreateUserId(): string {
    const stored = sessionStorage.getItem('collab_uid')
    if (stored) return stored
    const id = uid()
    sessionStorage.setItem('collab_uid', id)
    return id
}

export function getUserColor(id: string): string {
    return USER_COLORS[hashStr(id) % USER_COLORS.length]
}

export function getUserName(id: string): string {
    // 已有登录体系后，这里只作为协同层的兜底展示名
    return 'You-' + id.slice(0, 4).toUpperCase()
}

export function getUserShort(name: string): string {
    // e.g. "You-1A2B" -> "1A"
    return name.split('-')[1]?.slice(0, 2).toUpperCase() || 'ME'
}