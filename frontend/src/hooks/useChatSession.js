const KEY = 'findup_chat_session'
const TTL_MS = 24 * 60 * 60 * 1000

export function useChatSession() {
    const load = () => {
        try {
            const raw = localStorage.getItem(KEY)
            if (!raw) return null
            const data = JSON.parse(raw)
            if (Date.now() - new Date(data.savedAt).getTime() > TTL_MS) {
                localStorage.removeItem(KEY)
                return null
            }
            return data.messages ?? null
        } catch { return null }
    }

    const save = (messages) => {
        // Ne sauvegarder que les messages utilisateur+bot (pas le message initial)
        if (!messages?.length) return
        localStorage.setItem(KEY, JSON.stringify({
            messages,
            savedAt: new Date().toISOString(),
            version: 1
        }))
    }

    const clear = () => localStorage.removeItem(KEY)

    return { load, save, clear }
}