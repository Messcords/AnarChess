import { describe, it, expect } from 'vitest'
import { initialBoard, cellAt, movePiece, pieceColor, pieceGlyph, type BoardMatrix } from '~/utils/pieces'

const pieceCount = (board: BoardMatrix) => board.flat().filter((cell) => cell !== '').length

describe('initialBoard', () => {
  it('matches the starting position example of the API contract', () => {
    expect(initialBoard()).toEqual([
      ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
      ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
      ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
    ])
  })

  it('returns a fresh, independent board each call', () => {
    const first = initialBoard()
    first[0]![0] = ''
    first[6]![4] = ''
    expect(initialBoard()[0]![0]).toBe('bR')
    expect(pieceCount(initialBoard())).toBe(32)
  })
})

describe('cellAt', () => {
  it('reads a square with row 0 = rank 8 and column 0 = file a', () => {
    const board = initialBoard()
    expect(cellAt(board, 'a8')).toBe('bR')
    expect(cellAt(board, 'd8')).toBe('bQ')
    expect(cellAt(board, 'e1')).toBe('wK')
    expect(cellAt(board, 'h1')).toBe('wR')
    expect(cellAt(board, 'e2')).toBe('wP')
    expect(cellAt(board, 'e4')).toBe('')
  })
})

describe('movePiece', () => {
  it('moves a piece to an empty square', () => {
    const after = movePiece(initialBoard(), 'e2', 'e4')
    expect(cellAt(after, 'e2')).toBe('')
    expect(cellAt(after, 'e4')).toBe('wP')
    expect(pieceCount(after)).toBe(32)
  })

  it('captures the piece on the target square, whatever its color', () => {
    const after = movePiece(initialBoard(), 'd1', 'd8')
    expect(pieceCount(after)).toBe(31)
    expect(cellAt(after, 'd8')).toBe('wQ')
    const own = movePiece(initialBoard(), 'a1', 'a2')
    expect(pieceCount(own)).toBe(31)
    expect(cellAt(own, 'a2')).toBe('wR')
  })

  it('does not mutate its input', () => {
    const before = initialBoard()
    movePiece(before, 'e2', 'e4')
    expect(before).toEqual(initialBoard())
  })

  it('keeps every piece when from is empty or equals to', () => {
    expect(movePiece(initialBoard(), 'e4', 'e5')).toEqual(initialBoard())
    expect(movePiece(initialBoard(), 'e2', 'e2')).toEqual(initialBoard())
  })
})

describe('pieceGlyph', () => {
  it('uses Unicode symbols forced to text presentation', () => {
    expect(pieceGlyph('wK')).toBe('♔︎')
    expect(pieceGlyph('bP')).toBe('♟︎')
  })
})

describe('pieceColor', () => {
  it('reads the color from the code', () => {
    expect(pieceColor('wK')).toBe('white')
    expect(pieceColor('bP')).toBe('black')
  })
})
