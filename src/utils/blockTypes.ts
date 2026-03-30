import type { BlockTypeMap } from './types'

export const BLOCK_TYPES: BlockTypeMap = {
    text: { placeholder: '写点什么，或输入 / 打开命令菜单…', icon: '' },
    h1: { placeholder: '标题 1', icon: '' },
    h2: { placeholder: '标题 2', icon: '' },
    h3: { placeholder: '标题 3', icon: '' },
    todo: { placeholder: '待办事项', icon: '' },
    quote: { placeholder: '引用…', icon: '' },
    code: { placeholder: '代码…', icon: '' },
}

/** 输入 "# " → 自动转为 h1，以此类推 */
export const MD_SHORTCUTS: Record<string, string> = {
    '#': 'h1',
    '##': 'h2',
    '###': 'h3',
    '>': 'quote',
    '```': 'code',
}