import { coordsToSquare, squareToCoords, type Square } from '~/utils/chess'
import { cellAt, movePiece, pieceColor, type BoardMatrix, type Color } from '~/utils/pieces'

// A move already played, kept by the page to know if a king or a rook has moved.
export type Move = {
  from: Square
  to: Square
}

// A direction on the board: how many rows and columns we move at each step.
type Direction = {
  row: number
  col: number
}

// One castling: the king goes from `king` to `kingTo`, the rook from `rook`
// to `rookTo`, and every square in `between` must be empty.
type Castling = {
  king: Square
  kingTo: Square
  rook: Square
  rookTo: Square
  between: Square[]
}

const CASTLINGS: Castling[] = [
  {
    king: 'e1',
    kingTo: 'g1',
    rook: 'h1',
    rookTo: 'f1',
    between: ['f1', 'g1'],
  },
  {
    king: 'e1',
    kingTo: 'c1',
    rook: 'a1',
    rookTo: 'd1',
    between: ['b1', 'c1', 'd1'],
  },
  {
    king: 'e8',
    kingTo: 'g8',
    rook: 'h8',
    rookTo: 'f8',
    between: ['f8', 'g8'],
  },
  {
    king: 'e8',
    kingTo: 'c8',
    rook: 'a8',
    rookTo: 'd8',
    between: ['b8', 'c8', 'd8'],
  },
]

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
function slidingMoves(
  board: BoardMatrix,
  from: Square,
  color: Color,
  directions: Direction[],
): Square[] {
  const [row, col] = squareToCoords(from)
  const moves: Square[] = []

  for (const direction of directions) {
    for (let distance = 1; distance < 8; distance++) {
      const targetRow = row + direction.row * distance
      const targetCol = col + direction.col * distance
      const square = coordsToSquare(targetRow, targetCol)

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

function singleStepMoves(
  board: BoardMatrix,
  from: Square,
  color: Color,
  directions: Direction[],
): Square[] {
  const [row, col] = squareToCoords(from)
  const moves: Square[] = []

  for (const direction of directions) {
    const square = coordsToSquare(row + direction.row, col + direction.col)
    if (square === undefined) {
      continue
    }

    const isFree = isEmpty(board, square)
    const canCapture = isEnemy(board, square, color)
    if (isFree || canCapture) {
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
    const isOnStartRow = row === startRow
    const twoStepsIsFree = twoSteps !== undefined && isEmpty(board, twoSteps)
    if (isOnStartRow && twoStepsIsFree) {
      moves.push(twoSteps)
    }
  }

  const leftDiagonal = coordsToSquare(row + forward, col - 1)
  if (leftDiagonal !== undefined && isEnemy(board, leftDiagonal, color)) {
    moves.push(leftDiagonal)
  }

  const rightDiagonal = coordsToSquare(row + forward, col + 1)
  if (rightDiagonal !== undefined && isEnemy(board, rightDiagonal, color)) {
    moves.push(rightDiagonal)
  }
  return moves
}

function hasMoved(history: Move[], square: Square): boolean {
  return history.some((move) => move.from === square || move.to === square)
}

/**
 * Castling is allowed when the king is on its starting square, the rook of
 * the same color is in the corner, neither of them has ever moved (they
 * never appear in the history), and every square between them is empty.
 * Check is not part of the game yet, so it is not tested here.
 */
function canCastle(
  board: BoardMatrix,
  from: Square,
  history: Move[],
  castling: Castling,
): boolean {
  const isKingStartSquare = from === castling.king
  const kingHasMoved = hasMoved(history, castling.king)
  const rookHasMoved = hasMoved(history, castling.rook)
  if (!isKingStartSquare || kingHasMoved || rookHasMoved) {
    return false
  }

  const king = cellAt(board, from)
  const rook = cellAt(board, castling.rook)
  if (king === '' || rook === '') {
    return false
  }

  const isRook = rook[1] === 'R'
  const isSameColor = pieceColor(rook) === pieceColor(king)
  if (!isRook || !isSameColor) {
    return false
  }

  const pathIsEmpty = castling.between.every((square) => isEmpty(board, square))
  return pathIsEmpty
}

function castlingMoves(board: BoardMatrix, from: Square, history: Move[]): Square[] {
  const moves: Square[] = []
  for (const castling of CASTLINGS) {
    if (canCastle(board, from, history, castling)) {
      moves.push(castling.kingTo)
    }
  }
  return moves
}

/** Squares where the piece on `from` can go (no check and no en passant). */
export function legalMoves(board: BoardMatrix, from: Square, history: Move[] = []): Square[] {
  const piece = cellAt(board, from)
  if (piece === '') {
    return []
  }

  const color = pieceColor(piece)
  const type = piece[1]

  if (type === 'P') {
    return pawnMoves(board, from, color)
  }
  if (type === 'N') {
    return singleStepMoves(board, from, color, KNIGHT_JUMPS)
  }
  if (type === 'B') {
    return slidingMoves(board, from, color, BISHOP_DIRECTIONS)
  }
  if (type === 'R') {
    return slidingMoves(board, from, color, ROOK_DIRECTIONS)
  }
  if (type === 'Q') {
    return slidingMoves(board, from, color, ALL_DIRECTIONS)
  }
  if (type === 'K') {
    const normalMoves = singleStepMoves(board, from, color, ALL_DIRECTIONS)
    const castling = castlingMoves(board, from, history)
    return normalMoves.concat(castling)
  }
  return []
}

// When the king has just castled, the rook jumps to the other side of the king.
function moveRookIfCastling(board: BoardMatrix, kingFrom: Square, kingTo: Square): BoardMatrix {
  for (const castling of CASTLINGS) {
    const isThisCastling = castling.king === kingFrom && castling.kingTo === kingTo
    if (isThisCastling) {
      return movePiece(board, castling.rook, castling.rookTo)
    }
  }
  return board
}

/**
 * Plays a legal move on the board. It works like movePiece, plus two rules:
 * when the king castles, the rook moves too, and a pawn that reaches the
 * last rank becomes a queen.
 */
export function playMove(board: BoardMatrix, from: Square, to: Square): BoardMatrix {
  const piece = cellAt(board, from)
  let next = movePiece(board, from, to)

  const isKing = piece === 'wK' || piece === 'bK'
  if (isKing) {
    next = moveRookIfCastling(next, from, to)
  }

  const whitePawnOnLastRank = piece === 'wP' && to[1] === '8'
  const blackPawnOnLastRank = piece === 'bP' && to[1] === '1'
  if (whitePawnOnLastRank || blackPawnOnLastRank) {
    const [row, col] = squareToCoords(to)
    const queen = whitePawnOnLastRank ? 'wQ' : 'bQ'
    next[row]![col] = queen
  }
  return next
}
