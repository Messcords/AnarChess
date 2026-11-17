import { squareToCoords, type Square } from '~/utils/chess'

/** Same values as the contract's PlayerRole / gameState.turn. */
export type Color = 'white' | 'black'

/** Contract piece code: color (w|b) + piece letter (King Queen Rook Bishop kNight Pawn). */
export type PieceCode = `${'w' | 'b'}${'K' | 'Q' | 'R' | 'B' | 'N' | 'P'}`

/** A board cell: a piece code, or '' for an empty square. */
export type Cell = PieceCode | ''

/** Contract `Board` (docs/openapi.yaml): 8×8 matrix, row 0 = rank 8, column 0 = file a. */
export type BoardMatrix = Cell[][]

const BACK_RANK = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'] as const

const GLYPHS: Record<PieceCode, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

/** U+FE0E forces text presentation, so ♟ never renders as a colored emoji. */
const TEXT_PRESENTATION = '︎'

export function initialBoard(): BoardMatrix {
  const empty = (): Cell[] => Array<Cell>(8).fill('')
  return [
    BACK_RANK.map((p): Cell => `b${p}`),
    Array<Cell>(8).fill('bP'),
    empty(),
    empty(),
    empty(),
    empty(),
    Array<Cell>(8).fill('wP'),
    BACK_RANK.map((p): Cell => `w${p}`),
  ]
}

export function cellAt(board: readonly (readonly Cell[])[], square: Square): Cell {
  const [row, col] = squareToCoords(square)
  return board[row]?.[col] ?? ''
}

/** Free move (no chess rules): whatever stands on `to` is captured. Never mutates `board`. */
export function movePiece(board: readonly (readonly Cell[])[], from: Square, to: Square): BoardMatrix {
  const next = board.map((row) => [...row])
  const moving = cellAt(board, from)
  if (moving === '' || from === to) return next
  const [fromRow, fromCol] = squareToCoords(from)
  const [toRow, toCol] = squareToCoords(to)
  next[toRow]![toCol] = moving
  next[fromRow]![fromCol] = ''
  return next
}

export function pieceGlyph(code: PieceCode): string {
  return GLYPHS[code] + TEXT_PRESENTATION
}

export function pieceColor(code: PieceCode): Color {
  return code[0] === 'w' ? 'white' : 'black'
}
