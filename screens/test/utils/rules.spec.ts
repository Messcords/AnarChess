import { describe, it, expect } from 'vitest'
import type { Square } from '~/utils/chess'
import { initialBoard, type BoardMatrix } from '~/utils/pieces'
import { legalMoves } from '~/utils/rules'
import { boardWith } from '../helpers/board'

const moves = (board: BoardMatrix, from: Square) => legalMoves(board, from).sort()

describe('legalMoves at the starting position', () => {
  it('lets the e2 pawn advance one or two squares', () => {
    expect(moves(initialBoard(), 'e2')).toEqual(['e3', 'e4'])
  })

  it('lets the b1 knight jump to a3 and c3', () => {
    expect(moves(initialBoard(), 'b1')).toEqual(['a3', 'c3'])
  })

  it('blocks the rook, bishop, queen and king at start', () => {
    for (const square of ['a1', 'c1', 'd1', 'e1'] as const) {
      expect(moves(initialBoard(), square)).toEqual([])
    }
  })

  it('moves black pawns down the board', () => {
    expect(moves(initialBoard(), 'e7')).toEqual(['e5', 'e6'])
  })

  it('returns nothing for an empty square', () => {
    expect(moves(initialBoard(), 'e4')).toEqual([])
  })
})

describe('pawn', () => {
  it('cannot move or capture straight ahead', () => {
    expect(moves(boardWith({ e2: 'wP', e3: 'bP' }), 'e2')).toEqual([])
  })

  it('needs both squares free for the double step', () => {
    expect(moves(boardWith({ e2: 'wP', e4: 'bP' }), 'e2')).toEqual(['e3'])
  })

  it('advances one square off its starting rank', () => {
    expect(moves(boardWith({ e3: 'wP' }), 'e3')).toEqual(['e4'])
  })

  it('captures diagonally, never its own color', () => {
    expect(moves(boardWith({ e4: 'wP', d5: 'bP', f5: 'wN', e5: 'bP' }), 'e4')).toEqual(['d5'])
  })

  it('stays on the board at the edge', () => {
    expect(moves(boardWith({ a2: 'wP', b3: 'bP' }), 'a2')).toEqual(['a3', 'a4', 'b3'])
  })

  it('has no move on the last rank', () => {
    expect(moves(boardWith({ e8: 'wP' }), 'e8')).toEqual([])
  })
})

describe('sliding pieces', () => {
  it('rook stops before its own piece and on an enemy', () => {
    expect(moves(boardWith({ d4: 'wR', d6: 'wP', f4: 'bP' }), 'd4')).toEqual([
      'a4', 'b4', 'c4', 'd1', 'd2', 'd3', 'd5', 'e4', 'f4',
    ])
  })

  it('bishop covers its diagonals', () => {
    expect(moves(boardWith({ c1: 'wB' }), 'c1')).toEqual(['a3', 'b2', 'd2', 'e3', 'f4', 'g5', 'h6'])
  })

  it('queen combines rook and bishop', () => {
    expect(moves(boardWith({ d4: 'wQ' }), 'd4')).toHaveLength(27)
  })
})

describe('king and knight', () => {
  it('king moves one square, even from a corner', () => {
    expect(moves(boardWith({ a1: 'wK' }), 'a1')).toEqual(['a2', 'b1', 'b2'])
    expect(moves(boardWith({ e4: 'bK' }), 'e4')).toHaveLength(8)
  })

  it('knight jumps over pieces but not onto its own', () => {
    expect(moves(boardWith({ b1: 'wN', a3: 'wP', c2: 'bP', d2: 'bP' }), 'b1')).toEqual(['c3', 'd2'])
  })

  it('knight from a corner', () => {
    expect(moves(boardWith({ h8: 'bN' }), 'h8')).toEqual(['f7', 'g6'])
  })
})
