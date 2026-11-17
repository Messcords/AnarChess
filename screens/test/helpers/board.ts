import { squareToCoords, type Square } from '~/utils/chess'
import type { BoardMatrix, PieceCode } from '~/utils/pieces'

/** An empty board with only the given pieces, e.g. boardWith({ e4: 'wP', d5: 'bP' }). */
export function boardWith(pieces: { [square: string]: PieceCode }): BoardMatrix {
  const board: BoardMatrix = []
  for (let row = 0; row < 8; row++) {
    board.push(['', '', '', '', '', '', '', ''])
  }

  for (const square in pieces) {
    const [row, col] = squareToCoords(square as Square)
    board[row]![col] = pieces[square]!
  }
  return board
}
