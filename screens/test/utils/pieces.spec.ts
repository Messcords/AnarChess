import { describe, it, expect } from 'vitest'
import { initialPieces, pieceAt, movePiece, pieceGlyph } from '~/utils/pieces'

describe('initialPieces', () => {
  it('sets up 16 white and 16 black pieces', () => {
    const pieces = initialPieces()
    expect(pieces).toHaveLength(32)
    expect(pieces.filter((p) => p.owner === 'white')).toHaveLength(16)
    expect(new Set(pieces.map((p) => p.id)).size).toBe(32)
    expect(new Set(pieces.map((p) => p.square)).size).toBe(32)
  })

  it('places pieces on their starting squares', () => {
    const pieces = initialPieces()
    expect(pieceAt(pieces, 'e1')).toEqual({ id: 'p_w_k', type: 'king', owner: 'white', square: 'e1' })
    expect(pieceAt(pieces, 'd8')).toEqual({ id: 'p_b_q', type: 'queen', owner: 'black', square: 'd8' })
    expect(pieceAt(pieces, 'e2')?.id).toBe('p_w_p5')
    expect(pieceAt(pieces, 'h8')?.id).toBe('p_b_r2')
    expect(pieceAt(pieces, 'b1')?.type).toBe('knight')
    expect(pieceAt(pieces, 'c8')?.type).toBe('bishop')
    expect(pieceAt(pieces, 'e4')).toBeUndefined()
  })

  it('returns a fresh, independent board each call', () => {
    const first = initialPieces()
    first[0]!.square = 'e4'
    first.pop()
    expect(initialPieces()).toHaveLength(32)
    expect(pieceAt(initialPieces(), 'e4')).toBeUndefined()
  })
})

describe('movePiece', () => {
  it('moves a piece to an empty square', () => {
    const after = movePiece(initialPieces(), 'e2', 'e4')
    expect(pieceAt(after, 'e2')).toBeUndefined()
    expect(pieceAt(after, 'e4')?.id).toBe('p_w_p5')
    expect(after).toHaveLength(32)
  })

  it('captures the piece on the target square, whatever its color', () => {
    const after = movePiece(initialPieces(), 'd1', 'd8')
    expect(after).toHaveLength(31)
    expect(pieceAt(after, 'd8')?.id).toBe('p_w_q')
    const own = movePiece(initialPieces(), 'a1', 'a2')
    expect(own).toHaveLength(31)
    expect(pieceAt(own, 'a2')?.id).toBe('p_w_r1')
  })

  it('does not mutate its input', () => {
    const before = initialPieces()
    movePiece(before, 'e2', 'e4')
    expect(pieceAt(before, 'e2')?.id).toBe('p_w_p5')
    expect(before).toHaveLength(32)
  })

  it('keeps every piece when from is empty or equals to', () => {
    expect(movePiece(initialPieces(), 'e4', 'e5')).toEqual(initialPieces())
    expect(movePiece(initialPieces(), 'e2', 'e2')).toEqual(initialPieces())
  })
})

describe('pieceGlyph', () => {
  it('uses Unicode symbols forced to text presentation', () => {
    expect(pieceGlyph({ type: 'king', owner: 'white' })).toBe('♔︎')
    expect(pieceGlyph({ type: 'pawn', owner: 'black' })).toBe('♟︎')
  })
})
