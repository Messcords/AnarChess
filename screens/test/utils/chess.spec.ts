import { describe, it, expect } from 'vitest'
import { boardSquares, coordsToSquare, isLightSquare, squareToCoords } from '~/utils/chess'

describe('boardSquares', () => {
  it('returns 64 unique squares from a8 to h1', () => {
    const squares = boardSquares()
    expect(squares).toHaveLength(64)
    expect(new Set(squares).size).toBe(64)
    expect(squares[0]).toBe('a8')
    expect(squares[7]).toBe('h8')
    expect(squares[8]).toBe('a7')
    expect(squares[63]).toBe('h1')
  })
})

describe('isLightSquare', () => {
  it('colors squares like a real board', () => {
    expect(isLightSquare('a1')).toBe(false)
    expect(isLightSquare('h1')).toBe(true)
    expect(isLightSquare('a8')).toBe(true)
    expect(isLightSquare('h8')).toBe(false)
    expect(isLightSquare('d4')).toBe(false)
    expect(isLightSquare('e4')).toBe(true)
  })
})

describe('square coordinates', () => {
  it('maps squares to matrix rows and columns', () => {
    expect(squareToCoords('a8')).toEqual([0, 0])
    expect(squareToCoords('h1')).toEqual([7, 7])
    expect(squareToCoords('e2')).toEqual([6, 4])
    expect(coordsToSquare(6, 4)).toBe('e2')
  })

  it('returns undefined off the board', () => {
    expect(coordsToSquare(-1, 0)).toBeUndefined()
    expect(coordsToSquare(0, 8)).toBeUndefined()
  })
})
