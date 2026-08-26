let baseUrl = 'http://localhost:8080/api'

export function getBaseUrl() {
  return baseUrl
}

export function setBaseUrl(url) {
  baseUrl = (url || '').replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  return baseUrl
}

export function setApiBaseUrl(url) {
  baseUrl = (url || '').replace(/\/+$/, '')
}

export async function checkConnection(customUrl) {
  const url = (customUrl || baseUrl).replace(/\/+$/, '')
  try {
    const res = await fetch(`${url}/songs`)
    return res.ok
  } catch (_) {
    return false
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!res.ok) {
      let message = `Request failed: ${res.status} ${res.statusText}`
      try {
        const data = await res.json()
        message = data.message || data.error || message
      } catch (_) {}
      const error = new Error(message)
      error.status = res.status
      throw error
    }

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await res.json()
    }
    return await res.text()
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Could not reach ${baseUrl}`)
    }
    throw err
  }
}

export const api = {
  // Connection / Health
  checkConnection,
  health: () => request('/songs'),

  // Songs CRUD
  getSongs: () => request('/songs'),
  getSongById: (id) => request(`/songs/${id}`),
  insertSong: (body) => request('/songs', { method: 'POST', body: JSON.stringify(body) }),
  createSong: (body) => request('/songs', { method: 'POST', body: JSON.stringify(body) }),
  updateSong: async (id, body) => {
    try {
      return await request(`/songs/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    } catch (_) {
      try {
        return await request('/songs', { method: 'PUT', body: JSON.stringify(body) })
      } catch (__) {
        return await request('/songs', { method: 'POST', body: JSON.stringify(body) })
      }
    }
  },
  deleteSong: (id) => request(`/songs/${id}`, { method: 'DELETE' }),

  // Search
  searchLinear: (title) => request(`/search/linear?title=${encodeURIComponent(title)}`),
  searchBinary: (title) => request(`/search/binary?title=${encodeURIComponent(title)}`),

  // Sort
  bubbleSort: (order = 'asc') => request(`/sort/bubble?order=${order}`),
  selectionSort: (order = 'asc') => request(`/sort/selection?order=${order}`),
  insertionSort: (order = 'asc') => request(`/sort/insertion?order=${order}`),
  mergeSort: (order = 'asc') => request(`/sort/merge?order=${order}`),
  quickSort: (order = 'asc') => request(`/sort/quick?order=${order}`),

  // Playback Queue
  getQueue: () => request('/queue'),
  enqueue: async (songOrId) => {
    const songId = typeof songOrId === 'object' ? (songOrId.id || songOrId.songId) : songOrId
    const intId = parseInt(songId, 10)

    try {
      return await request(`/queue/${intId}`, {
        method: 'POST',
        body: typeof songOrId === 'object' ? JSON.stringify(songOrId) : null,
      })
    } catch (err) {
      try {
        return await request('/queue', {
          method: 'POST',
          body: JSON.stringify(typeof songOrId === 'object' ? songOrId : { id: intId }),
        })
      } catch (fallbackErr) {
        return await request(`/queue?id=${intId}`, { method: 'POST' })
      }
    }
  },
  dequeue: async (songId) => {
    if (songId) {
      const intId = parseInt(songId, 10)
      try {
        return await request(`/queue/${intId}`, { method: 'DELETE' })
      } catch (_) {
        try {
          return await request(`/queue?id=${intId}`, { method: 'DELETE' })
        } catch (__) {
          return await request('/queue', { method: 'DELETE' })
        }
      }
    }
    return await request('/queue', { method: 'DELETE' })
  },
  peekQueue: () => request('/queue/peek'),
  getQueueSize: () => request('/queue/size'),

  // Structures: Stack
  getStackHistory: async () => {
    try {
      return await request('/structures/stack/history')
    } catch (_) {
      try {
        return await request('/structures/stack')
      } catch (__) {
        return await request('/stack')
      }
    }
  },
  pushStack: async (body) => {
    const payload = typeof body === 'object' ? JSON.stringify(body) : JSON.stringify({ title: String(body) })
    try {
      return await request('/structures/stack/push', { method: 'POST', body: payload })
    } catch (_) {
      try {
        return await request('/structures/stack', { method: 'POST', body: payload })
      } catch (__) {
        return await request('/stack/push', { method: 'POST', body: payload })
      }
    }
  },
  popStack: async () => {
    try {
      return await request('/structures/stack/pop', { method: 'DELETE' })
    } catch (_) {
      try {
        return await request('/structures/stack', { method: 'DELETE' })
      } catch (__) {
        return await request('/stack/pop', { method: 'DELETE' })
      }
    }
  },
  peekStack: () => request('/structures/stack/peek'),

  // Structures: Hash Table
  getHashTable: () => request('/structures/hashtable'),
  putHashTable: (body) => request('/structures/hashtable/put', { method: 'POST', body: JSON.stringify(body) }),
  getHashTableKey: (key) => request(`/structures/hashtable/get/${encodeURIComponent(key)}`),
  removeHashTableKey: (key) => request(`/structures/hashtable/remove/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  // Structures: Set
  getSet: () => request('/structures/set'),
  addToSet: (body) => request('/structures/set/add', { method: 'POST', body: JSON.stringify(body) }),
  removeFromSet: (genre) => request(`/structures/set/remove/${encodeURIComponent(genre)}`, { method: 'DELETE' }),
  checkInSet: (genre) => request(`/structures/set/contains/${encodeURIComponent(genre)}`),

  // Structures: Linked List
  getLinkedList: () => request('/structures/linkedlist'),
  insertLinkedList: (body) => request('/structures/linkedlist/insert', { method: 'POST', body: JSON.stringify(body) }),
  deleteLinkedList: (id) => request(`/structures/linkedlist/delete/${id}`, { method: 'DELETE' }),

  // Trees: BST
  getBstInOrder: () => request('/trees/bst/inorder'),
  getBstPreOrder: () => request('/trees/bst/preorder'),
  getBstPostOrder: () => request('/trees/bst/postorder'),
  searchBst: (title) => request(`/trees/bst/search?title=${encodeURIComponent(title)}`),

  // Trees: AVL
  getAvlInOrder: () => request('/trees/avl/inorder'),
  getAvlPreOrder: () => request('/trees/avl/preorder'),
  getAvlPostOrder: () => request('/trees/avl/postorder'),
  searchAvl: (title) => request(`/trees/avl/search?title=${encodeURIComponent(title)}`),

  // Graph
  getGraph: () => request('/graph'),
  bfs: (genre) => request(`/graph/bfs?genre=${encodeURIComponent(genre)}`),
  dfs: (genre) => request(`/graph/dfs?genre=${encodeURIComponent(genre)}`),
}

export default api