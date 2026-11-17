import { describe, it, expect } from 'vitest'
import type { Square } from '~/utils/chess'
import { cellAt, initialBoard, movePiece, type BoardMatrix } from '~/utils/pieces'
import { isPromotion, legalMoves, playMove, promotedPiece, type Move } from '~/utils/rules'
import { boardWith } from '../helpers/board'

const moves = (board: BoardMatrix, from: Square, history: Move[] = []) =>
  legalMoves(board, from, history).sort()

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

describe('castling', () => {
  it('lets the king castle on both sides when the way is free', () => {
    const board = boardWith({ e1: 'wK', a1: 'wR', h1: 'wR' })
    expect(moves(board, 'e1')).toEqual(['c1', 'd1', 'd2', 'e2', 'f1', 'f2', 'g1'])
  })

  it('works for black too', () => {
    const board = boardWith({ e8: 'bK', h8: 'bR' })
    expect(moves(board, 'e8')).toContain('g8')
  })

  it('needs every square between the king and the rook to be empty', () => {
    const knightOnG1 = boardWith({ e1: 'wK', h1: 'wR', g1: 'wN' })
    const knightOnB1 = boardWith({ e1: 'wK', a1: 'wR', b1: 'wN' })
    expect(moves(knightOnG1, 'e1')).not.toContain('g1')
    expect(moves(knightOnB1, 'e1')).not.toContain('c1')
  })

  it('is not allowed once the king or the rook has moved', () => {
    const board = boardWith({ e1: 'wK', a1: 'wR', h1: 'wR' })
    const kingMoved: Move[] = [
      { from: 'e1', to: 'e2' },
      { from: 'e2', to: 'e1' },
    ]
    const rookMoved: Move[] = [
      { from: 'h1', to: 'h2' },
      { from: 'h2', to: 'h1' },
    ]

    expect(moves(board, 'e1', kingMoved)).not.toContain('g1')
    expect(moves(board, 'e1', kingMoved)).not.toContain('c1')
    expect(moves(board, 'e1', rookMoved)).not.toContain('g1')
    expect(moves(board, 'e1', rookMoved)).toContain('c1')
  })

  it('is not allowed once another piece has landed on the rook corner', () => {
    const board = boardWith({ e1: 'wK', h1: 'wR' })
    const rookReplaced: Move[] = [{ from: 'h5', to: 'h1' }]
    expect(moves(board, 'e1', rookReplaced)).not.toContain('g1')
  })

  it('is not allowed without an own rook in the corner', () => {
    const noRook = boardWith({ e1: 'wK' })
    const enemyRook = boardWith({ e1: 'wK', h1: 'bR' })
    expect(moves(noRook, 'e1')).not.toContain('g1')
    expect(moves(enemyRook, 'e1')).not.toContain('g1')
  })
})

describe('playMove', () => {
  it('moves the rook too when the king castles', () => {
    const kingSide = playMove(boardWith({ e1: 'wK', h1: 'wR' }), 'e1', 'g1')
    expect(cellAt(kingSide, 'g1')).toBe('wK')
    expect(cellAt(kingSide, 'f1')).toBe('wR')
    expect(cellAt(kingSide, 'h1')).toBe('')

    const queenSide = playMove(boardWith({ e8: 'bK', a8: 'bR' }), 'e8', 'c8')
    expect(cellAt(queenSide, 'c8')).toBe('bK')
    expect(cellAt(queenSide, 'd8')).toBe('bR')
    expect(cellAt(queenSide, 'a8')).toBe('')
  })

  it('turns a pawn reaching the last rank into a queen', () => {
    const whitePawn = playMove(boardWith({ e7: 'wP' }), 'e7', 'e8')
    const blackPawn = playMove(boardWith({ d2: 'bP' }), 'd2', 'd1')
    const pawnCapturing = playMove(boardWith({ e7: 'wP', d8: 'bR' }), 'e7', 'd8')

    expect(cellAt(whitePawn, 'e8')).toBe('wQ')
    expect(cellAt(blackPawn, 'd1')).toBe('bQ')
    expect(cellAt(pawnCapturing, 'd8')).toBe('wQ')
  })

  it('plays any other move like movePiece', () => {
    const played = playMove(initialBoard(), 'e2', 'e4')
    const moved = movePiece(initialBoard(), 'e2', 'e4')
    expect(played).toEqual(moved)
  })
})

describe('promotion choice', () => {
  it('knows when a pawn reaches the last rank', () => {
    expect(isPromotion(boardWith({ e7: 'wP' }), 'e7', 'e8')).toBe(true)
    expect(isPromotion(boardWith({ d2: 'bP' }), 'd2', 'd1')).toBe(true)
    expect(isPromotion(initialBoard(), 'e2', 'e4')).toBe(false)
    expect(isPromotion(boardWith({ e7: 'wQ' }), 'e7', 'e8')).toBe(false)
  })

  it('gives the promoted piece the color of the pawn', () => {
    expect(promotedPiece('wP', 'N')).toBe('wN')
    expect(promotedPiece('bP', 'R')).toBe('bR')
  })

  it('turns the pawn into the chosen piece', () => {
    const knight = playMove(boardWith({ e7: 'wP' }), 'e7', 'e8', 'N')
    const rook = playMove(boardWith({ d2: 'bP' }), 'd2', 'd1', 'R')

    expect(cellAt(knight, 'e8')).toBe('wN')
    expect(cellAt(rook, 'd1')).toBe('bR')
  })
})
