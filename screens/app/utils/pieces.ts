import { FILES, RANKS, type BoardFile, type BoardRank, type Square } from '~/utils/chess'

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

function toIndex(square: Square): [row: number, col: number] {
  return [RANKS.indexOf(square[1] as BoardRank), FILES.indexOf(square[0] as BoardFile)]
}

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
  const [row, col] = toIndex(square)
  return board[row]?.[col] ?? ''
}

/** Free move (no chess rules): whatever stands on `to` is captured. Never mutates `board`. */
export function movePiece(board: readonly (readonly Cell[])[], from: Square, to: Square): BoardMatrix {
  const next = board.map((row) => [...row])
  const moving = cellAt(board, from)
  if (moving === '' || from === to) return next
  const [fromRow, fromCol] = toIndex(from)
  const [toRow, toCol] = toIndex(to)
  next[toRow]![toCol] = moving
  next[fromRow]![fromCol] = ''
  return next
}

export function pieceGlyph(code: PieceCode): string {
  return GLYPHS[code] + TEXT_PRESENTATION
}
