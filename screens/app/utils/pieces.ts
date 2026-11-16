import { FILES, type Square } from '~/utils/chess'

/** Same shape as the `Piece` schema of docs/openapi.yaml (no jester in this POC). */
export type Owner = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

export interface Piece {
  id: string
  type: PieceType
  owner: Owner
  square: Square
}

/** Back rank from a to h, with the id suffix of each piece. */
const BACK_RANK: ReadonlyArray<{ type: PieceType; key: string }> = [
  { type: 'rook', key: 'r1' },
  { type: 'knight', key: 'n1' },
  { type: 'bishop', key: 'b1' },
  { type: 'queen', key: 'q' },
  { type: 'king', key: 'k' },
  { type: 'bishop', key: 'b2' },
  { type: 'knight', key: 'n2' },
  { type: 'rook', key: 'r2' },
]

const GLYPHS: Record<Owner, Record<PieceType, string>> = {
  white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
}

/** U+FE0E forces text presentation, so ♟ never renders as a colored emoji. */
const TEXT_PRESENTATION = '︎'

function sideSetup(owner: Owner, backRank: '1' | '8', pawnRank: '2' | '7'): Piece[] {
  const prefix = `p_${owner[0]}_`
  return FILES.flatMap((file, i): Piece[] => [
    { id: prefix + BACK_RANK[i]!.key, type: BACK_RANK[i]!.type, owner, square: `${file}${backRank}` },
    { id: `${prefix}p${i + 1}`, type: 'pawn', owner, square: `${file}${pawnRank}` },
  ])
}

export function initialPieces(): Piece[] {
  return [...sideSetup('white', '1', '2'), ...sideSetup('black', '8', '7')]
}

export function pieceAt(pieces: readonly Piece[], square: Square): Piece | undefined {
  return pieces.find((piece) => piece.square === square)
}

/** Free move (no chess rules): whatever stands on `to` is captured. */
export function movePiece(pieces: readonly Piece[], from: Square, to: Square): Piece[] {
  const moving = pieceAt(pieces, from)
  if (!moving || from === to) return pieces.map((piece) => ({ ...piece }))
  return pieces
    .filter((piece) => piece.square !== to)
    .map((piece) => (piece === moving ? { ...piece, square: to } : { ...piece }))
}

export function pieceGlyph(piece: Pick<Piece, 'type' | 'owner'>): string {
  return GLYPHS[piece.owner][piece.type] + TEXT_PRESENTATION
}
