import { parseApiError } from './apiError'

const BASE_URL = 'http://localhost:4010'

export type Board = string[][]

export interface PlayerAccess {
  boardId: string
  board?: Board
  playerId: string
  role: 'white' | 'black'
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
