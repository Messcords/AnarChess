import { coordsToSquare, squareToCoords, type Square } from '~/utils/chess'
import { cellAt, pieceColor, type BoardMatrix, type Color } from '~/utils/pieces'

// A direction on the board: how many rows and columns we move at each step.
type Direction = { row: number; col: number }

const ROOK_DIRECTIONS: Direction[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
]

const BISHOP_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
]

const ALL_DIRECTIONS: Direction[] = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS]

const KNIGHT_JUMPS: Direction[] = [
  { row: -2, col: -1 },
  { row: -2, col: 1 },
  { row: -1, col: -2 },
  { row: -1, col: 2 },
  { row: 1, col: -2 },
  { row: 1, col: 2 },
  { row: 2, col: -1 },
  { row: 2, col: 1 },
]

function isEmpty(board: BoardMatrix, square: Square): boolean {
  return cellAt(board, square) === ''
}

function isEnemy(board: BoardMatrix, square: Square, color: Color): boolean {
  const cell = cellAt(board, square)
  if (cell === '') {
    return false
  }
  return pieceColor(cell) !== color
}

/**
 * Bishop, rook and queen: in each direction, we go forward one square at a
 * time. An empty square is added and we keep going. On a piece we stop:
 * an enemy piece is added (it can be captured), our own piece is not.
 */
function slidingMoves(board: BoardMatrix, from: Square, color: Color, directions: Direction[]): Square[] {
  const [row, col] = squareToCoords(from)
  const moves: Square[] = []

  for (const direction of directions) {
    for (let distance = 1; distance < 8; distance++) {
      const square = coordsToSquare(row + direction.row * distance, col + direction.col * distance)
      if (square === undefined) {
        break
      }
      if (isEmpty(board, square)) {
        moves.push(square)
        continue
      }
      if (isEnemy(board, square, color)) {
        moves.push(square)
      }
      break
    }
  }
  return moves
}

/** King and knight: one single step in each direction, onto an empty square or an enemy piece. */
function singleStepMoves(board: BoardMatrix, from: Square, color: Color, directions: Direction[]): Square[] {
  const [row, col] = squareToCoords(from)
  const moves: Square[] = []

  for (const direction of directions) {
    const square = coordsToSquare(row + direction.row, col + direction.col)
    if (square === undefined) {
      continue
    }
    if (isEmpty(board, square) || isEnemy(board, square, color)) {
      moves.push(square)
    }
  }
  return moves
}

/**
 * Pawns go up the board (row - 1) for white and down (row + 1) for black.
 * They move one square forward if it is empty, two from their starting row
 * if both squares are empty, and capture one square forward in diagonal.
 */
function pawnMoves(board: BoardMatrix, from: Square, color: Color): Square[] {
  const [row, col] = squareToCoords(from)
  const forward = color === 'white' ? -1 : 1
  const startRow = color === 'white' ? 6 : 1
  const moves: Square[] = []

  const oneStep = coordsToSquare(row + forward, col)
  if (oneStep !== undefined && isEmpty(board, oneStep)) {
    moves.push(oneStep)

    const twoSteps = coordsToSquare(row + 2 * forward, col)
    if (row === startRow && twoSteps !== undefined && isEmpty(board, twoSteps)) {
      moves.push(twoSteps)
    }
  }

  const leftCapture = coordsToSquare(row + forward, col - 1)
  if (leftCapture !== undefined && isEnemy(board, leftCapture, color)) {
    moves.push(leftCapture)
  }

  const rightCapture = coordsToSquare(row + forward, col + 1)
  if (rightCapture !== undefined && isEnemy(board, rightCapture, color)) {
    moves.push(rightCapture)
  }
  return moves
}

/** Squares where the piece on `from` can go (no check, castling, en passant or promotion). */
export function legalMoves(board: BoardMatrix, from: Square): Square[] {
  const piece = cellAt(board, from)
  if (piece === '') {
    return []
  }

  const color = pieceColor(piece)
  const type = piece[1]

  if (type === 'P') return pawnMoves(board, from, color)
  if (type === 'N') return singleStepMoves(board, from, color, KNIGHT_JUMPS)
  if (type === 'K') return singleStepMoves(board, from, color, ALL_DIRECTIONS)
  if (type === 'B') return slidingMoves(board, from, color, BISHOP_DIRECTIONS)
  if (type === 'R') return slidingMoves(board, from, color, ROOK_DIRECTIONS)
  if (type === 'Q') return slidingMoves(board, from, color, ALL_DIRECTIONS)
  return []
}
