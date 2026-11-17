import { parseApiError } from './apiError'
import type { BoardMatrix } from './pieces'

export type Board = BoardMatrix

export type PlayerRole = 'white' | 'black'
export type BoardStatus = 'waiting' | 'in_progress' | 'finished'

export interface PlayerAccess {
  boardId: string
  playerId: string
  role: PlayerRole
  token: string
}

export interface CreatedPlayerAccess extends PlayerAccess {
  board: Board
}

export interface GameState {
  status: BoardStatus
  turn: PlayerRole
  ruleSet: string
  players: Array<{ playerId: string; role: PlayerRole }>
  outcome: { winner: PlayerRole | null; reason: 'no_pieces_left' | 'specific_rule' } | null
}

export interface BoardState {
  id: string
  gameState: GameState
  board: Board
}

export interface BoardStateUpdate {
  gameState: Pick<GameState, 'status' | 'turn'> & Partial<Pick<GameState, 'ruleSet' | 'outcome'>>
  board: Board
}

async function request<T>(apiBase: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase.replace(/\/$/, '')}${path}`, init)
  if (!response.ok) throw await parseApiError(response)
  return (await response.json()) as T
}

export function createBoard(apiBase: string): Promise<CreatedPlayerAccess> {
  return request(apiBase, '/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function joinBoard(apiBase: string, boardId: string): Promise<PlayerAccess> {
  return request(apiBase, `/boards/${encodeURIComponent(boardId)}/join`, { method: 'POST' })
}

export function getBoardState(apiBase: string, boardId: string): Promise<BoardState> {
  return request(apiBase, `/boards/${encodeURIComponent(boardId)}`)
}

export function updateBoardState(
  apiBase: string,
  access: PlayerAccess,
  update: BoardStateUpdate,
): Promise<BoardState> {
  return request(apiBase, `/boards/${encodeURIComponent(access.boardId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Player-Token': access.token,
    },
    body: JSON.stringify(update),
  })
}

export function resetBoard(apiBase: string, access: PlayerAccess): Promise<BoardState> {
  return request(apiBase, `/boards/${encodeURIComponent(access.boardId)}/reset`, {
    method: 'POST',
    headers: { 'X-Player-Token': access.token },
  })
}
