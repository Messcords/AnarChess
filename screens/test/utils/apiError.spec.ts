import { afterEach, describe, expect, it, vi } from 'vitest'

import { joinBoard } from '../../app/utils/apiClient'

describe('API contract error', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects joinBoard with an ApiError when the board is not found', async () => {
    const body = { code: 'board_not_found', message: 'Partie introuvable' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(joinBoard('http://localhost:8000', 'brd_unknown')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'board_not_found',
      message: 'Partie introuvable',
    })
  })
})
