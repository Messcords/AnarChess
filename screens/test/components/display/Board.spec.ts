import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import Board from '@/components/display/Board.vue'
import { initialBoard } from '~/utils/pieces'
import type { Move } from '~/utils/rules'
import { boardWith } from '../../helpers/board'

/** The squares (e.g. ['e3', 'e4']) that have the given CSS class, sorted. */
function squaresWith(wrapper: VueWrapper, cssClass: string): string[] {
  return wrapper
    .findAll(`.${cssClass}`)
    .map((element) => element.attributes('data-square') ?? '')
    .sort()
}

describe('Board', () => {
  it('Display of the board', () => {
    const wrapper = mount(Board)
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('renders 64 squares in display order', () => {
    const squares = mount(Board).findAll('[data-square]')
    expect(squares).toHaveLength(64)
    expect(squares[0]!.attributes('data-square')).toBe('a8')
    expect(squares[63]!.attributes('data-square')).toBe('h1')
  })

  it('colors squares light and dark', () => {
    const wrapper = mount(Board)
    expect(wrapper.get('[data-square="a1"]').classes()).toContain('dark')
    expect(wrapper.get('[data-square="h1"]').classes()).toContain('light')
  })

  it('shows file and rank coordinates', () => {
    const wrapper = mount(Board)
    expect(wrapper.findAll('.coord-file').map((e) => e.text())).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(wrapper.findAll('.coord-rank').map((e) => e.text())).toEqual(['8', '7', '6', '5', '4', '3', '2', '1'])
  })
})

describe('Board with pieces', () => {
  const mountWithPieces = () => mount(Board, { props: { board: initialBoard() } })

  it('shows each piece on its square', () => {
    const wrapper = mountWithPieces()
    expect(wrapper.findAll('.piece')).toHaveLength(32)
    expect(wrapper.get('[data-square="e1"]').text()).toContain('♔')
    expect(wrapper.get('[data-square="e8"]').text()).toContain('♚')
    expect(wrapper.find('[data-square="e4"] .piece').exists()).toBe(false)
  })

  it('selects a piece on first click', async () => {
    const wrapper = mountWithPieces()
    await wrapper.get('[data-square="e2"]').trigger('click')
    expect(wrapper.get('[data-square="e2"]').classes()).toContain('selected')
    expect(wrapper.get('[data-square="e2"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.emitted('move')).toBeUndefined()
  })

  it('emits move on second click and clears selection', async () => {
    const wrapper = mountWithPieces()
    await wrapper.get('[data-square="e2"]').trigger('click')
    await wrapper.get('[data-square="e4"]').trigger('click')
    expect(wrapper.emitted('move')).toEqual([['e2', 'e4']])
    expect(wrapper.findAll('.selected')).toHaveLength(0)
  })

  it('ignores a click on an empty square when nothing is selected', async () => {
    const wrapper = mountWithPieces()
    await wrapper.get('[data-square="e4"]').trigger('click')
    expect(wrapper.findAll('.selected')).toHaveLength(0)
    expect(wrapper.emitted('move')).toBeUndefined()
  })

  it('deselects when the selected piece is clicked again', async () => {
    const wrapper = mountWithPieces()
    await wrapper.get('[data-square="e2"]').trigger('click')
    await wrapper.get('[data-square="e2"]').trigger('click')
    expect(wrapper.findAll('.selected')).toHaveLength(0)
    expect(wrapper.emitted('move')).toBeUndefined()
  })
})

describe('Board with move rules', () => {
  it('highlights the legal targets of the selected piece', async () => {
    const wrapper = mount(Board, { props: { board: initialBoard() } })
    await wrapper.get('[data-square="e2"]').trigger('click')
    expect(squaresWith(wrapper, 'target')).toEqual(['e3', 'e4'])
    expect(squaresWith(wrapper, 'capture')).toEqual([])
  })

  it('marks enemy pieces it can capture and captures them', async () => {
    const wrapper = mount(Board, { props: { board: boardWith({ e4: 'wP', d5: 'bP' }) } })
    await wrapper.get('[data-square="e4"]').trigger('click')
    expect(squaresWith(wrapper, 'capture')).toEqual(['d5'])
    expect(squaresWith(wrapper, 'target')).toEqual(['e5'])
    await wrapper.get('[data-square="d5"]').trigger('click')
    expect(wrapper.emitted('move')).toEqual([['e4', 'd5']])
  })

  it('ignores an illegal destination and clears the selection', async () => {
    const wrapper = mount(Board, { props: { board: initialBoard() } })
    await wrapper.get('[data-square="e2"]').trigger('click')
    await wrapper.get('[data-square="e5"]').trigger('click')
    expect(wrapper.emitted('move')).toBeUndefined()
    expect(wrapper.findAll('.selected, .target')).toHaveLength(0)
  })

  it('switches the selection to another piece of the same color', async () => {
    const wrapper = mount(Board, { props: { board: initialBoard() } })
    await wrapper.get('[data-square="e2"]').trigger('click')
    await wrapper.get('[data-square="d2"]').trigger('click')
    expect(wrapper.get('[data-square="d2"]').classes()).toContain('selected')
    expect(wrapper.emitted('move')).toBeUndefined()
  })

  it('does not switch to an enemy piece out of reach', async () => {
    const wrapper = mount(Board, { props: { board: initialBoard() } })
    await wrapper.get('[data-square="e2"]').trigger('click')
    await wrapper.get('[data-square="e7"]').trigger('click')
    expect(wrapper.findAll('.selected')).toHaveLength(0)
  })
})

describe('Board castling', () => {
  it('offers castling only while the rook has not moved', async () => {
    const board = boardWith({ e1: 'wK', h1: 'wR' })
    const fresh = mount(Board, { props: { board } })
    await fresh.get('[data-square="e1"]').trigger('click')
    expect(squaresWith(fresh, 'target')).toContain('g1')

    const history: Move[] = [
      { from: 'h1', to: 'h2' },
      { from: 'h2', to: 'h1' },
    ]
    const moved = mount(Board, { props: { board, history } })
    await moved.get('[data-square="e1"]').trigger('click')
    expect(squaresWith(moved, 'target')).not.toContain('g1')
  })
})
