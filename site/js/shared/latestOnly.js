export const STALE = Symbol('stale')

export const latestOnly = (task) => {
  let latestCall = 0
  return async (...args) => {
    const call = ++latestCall
    try {
      const value = await task(...args)
      return call === latestCall ? value : STALE
    } catch (error) {
      if (call !== latestCall) return STALE
      throw error
    }
  }
}
