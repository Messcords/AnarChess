import { it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import Board from '@/components/display/Board.vue'

it('Display of the board', () => {
  const wrapper = mount(Board)
  expect(wrapper.find('div').exists()).toBe(true)
})
