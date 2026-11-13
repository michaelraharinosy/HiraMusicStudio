const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const cloudEnabled = Boolean(url && key)

async function request(path, options = {}) {
  if (!cloudEnabled) throw new Error('Cloud storage is not configured. Add the Supabase URL and publishable key to frontend/.env.')
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Supabase request failed (${response.status})`)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function getCloudSongs() {
  const rows = await request('hira_songs?select=id,data&order=updated_at.desc')
  return rows.map(row => row.data)
}

export async function saveCloudSong(song) {
  await request('hira_songs?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: String(song.id), data: song, updated_at: new Date().toISOString() }),
  })
}

export async function deleteCloudSong(songId) {
  await request(`hira_songs?id=eq.${encodeURIComponent(String(songId))}`, { method: 'DELETE' })
}
