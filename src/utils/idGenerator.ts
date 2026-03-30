/**
 * 生成一个 8 位 base-36 随机 ID
 */
export const uid = (): string =>
    Math.random().toString(36).slice(2, 10)