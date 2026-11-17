export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

/** Ranks in display order, from top (8) to bottom (1). */
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

export type BoardFile = (typeof FILES)[number]
export type BoardRank = (typeof RANKS)[number]
export type Square = `${BoardFile}${BoardRank}`

/** All 64 squares in display order: rank 8 from a to h, down to rank 1. */
export function boardSquares(): Square[] {
  return RANKS.flatMap((rank) => FILES.map((file): Square => `${file}${rank}`))
}

/** a1 is dark, h1 is light. */
export function isLightSquare(square: Square): boolean {
  const fileIndex = FILES.indexOf(square[0] as BoardFile)
  const rank = Number(square[1])
  return (fileIndex + rank) % 2 === 0
}

/** Row 0 is rank 8 and column 0 is file a, like the board matrix of the API. */
export function squareToCoords(square: Square): [number, number] {
  const row = RANKS.indexOf(square[1] as BoardRank)
  const col = FILES.indexOf(square[0] as BoardFile)
  return [row, col]
}

/** Returns undefined when the row or the column is outside the board. */
export function coordsToSquare(row: number, col: number): Square | undefined {
  if (row < 0 || row > 7 || col < 0 || col > 7) {
    return undefined
  }
  return `${FILES[col]}${RANKS[row]}` as Square
}
