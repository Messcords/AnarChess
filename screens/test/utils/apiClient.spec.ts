import { afterEach, describe, expect, it, vi } from 'vitest'

import { createBoard, joinBoard, resetBoard, updateBoardState } from '../../app/utils/apiClient'

describe('API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a board through the configured API base', async () => {
    const responseBody = {
      boardId: 'brd_01',
      board: [],
      playerId: 'plr_01',
      role: 'white',
      token: 'tok_white_01',
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), { status: 201 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(createBoard('http://localhost:8000/')).resolves.toEqual(responseBody)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  })

  it('sends the player token with board updates and reset requests', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => Promise.resolve(new Response(JSON.stringify({ id: 'brd/01' }), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const access = {
      boardId: 'brd/01',
      playerId: 'plr_01',
      role: 'white' as const,
      token: 'tok_white_01',
    }
    const update = {
      gameState: { status: 'in_progress' as const, turn: 'black' as const },
      board: [],
    }

    await updateBoardState('http://localhost:8000', access, update)
    await resetBoard('http://localhost:8000', access)

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:8000/boards/brd%2F01')
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Player-Token': access.token },
      body: JSON.stringify(update),
    })
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      headers: { 'X-Player-Token': access.token },
    })
  })

  it('encodes the board id when joining', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ boardId: 'brd/01' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await joinBoard('http://localhost:8000', 'brd/01')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/boards/brd%2F01/join', {
      method: 'POST',
    })
  })
})
