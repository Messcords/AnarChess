import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Board from '@/components/display/Board.vue'

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
