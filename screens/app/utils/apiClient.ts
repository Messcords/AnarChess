import { parseApiError } from './apiError'

const BASE_URL = 'http://localhost:4010'

export interface PlayerAccess {
  boardId: string
  playerId: string
  role: 'white' | 'black' | 'jester'
  token: string
}

export async function joinBoard(boardId: string): Promise<PlayerAccess> {
  const response = await fetch(`${BASE_URL}/boards/${encodeURIComponent(boardId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) throw await parseApiError(response)
  return (await response.json()) as PlayerAccess
}
