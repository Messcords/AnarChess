import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

describe('home page', () => {
  it('starts with all 32 pieces', async () => {
    const page = await mountSuspended(IndexPage)
    expect(page.findAll('.piece')).toHaveLength(32)
  })

  it('moves a piece with two clicks', async () => {
    const page = await mountSuspended(IndexPage)
    await page.get('[data-square="e2"]').trigger('click')
    await page.get('[data-square="e4"]').trigger('click')
    expect(page.find('[data-square="e2"] .piece').exists()).toBe(false)
    expect(page.get('[data-square="e4"]').text()).toContain('♙')
  })

  it('captures and then resets to the starting position', async () => {
    const page = await mountSuspended(IndexPage)
    const play = async (from: string, to: string) => {
      await page.get(`[data-square="${from}"]`).trigger('click')
      await page.get(`[data-square="${to}"]`).trigger('click')
    }
    await play('e2', 'e4')
    await play('d7', 'd5')
    await play('e4', 'd5')
    expect(page.findAll('.piece')).toHaveLength(31)
    expect(page.get('[data-square="d5"]').text()).toContain('♙')
    await page.get('[data-testid="reset"]').trigger('click')
    expect(page.findAll('.piece')).toHaveLength(32)
    expect(page.get('[data-square="d7"]').text()).toContain('♟')
    expect(page.get('[data-square="e2"]').text()).toContain('♙')
  })

  it('castles the king with the rook', async () => {
    const page = await mountSuspended(IndexPage)
    const play = async (from: string, to: string) => {
      await page.get(`[data-square="${from}"]`).trigger('click')
      await page.get(`[data-square="${to}"]`).trigger('click')
    }
    await play('e2', 'e4')
    await play('e7', 'e5')
    await play('g1', 'f3')
    await play('b8', 'c6')
    await play('f1', 'c4')
    await play('g8', 'f6')
    await play('e1', 'g1')
    expect(page.get('[data-square="g1"]').text()).toContain('♔')
    expect(page.get('[data-square="f1"]').text()).toContain('♖')
    expect(page.find('[data-square="h1"] .piece').exists()).toBe(false)
  })

  it('promotes a pawn into the piece chosen by the player', async () => {
    const page = await mountSuspended(IndexPage)
    const play = async (from: string, to: string) => {
      await page.get(`[data-square="${from}"]`).trigger('click')
      await page.get(`[data-square="${to}"]`).trigger('click')
    }
    await play('a2', 'a4')
    await play('h7', 'h6')
    await play('a4', 'a5')
    await play('h6', 'h5')
    await play('a5', 'a6')
    await play('h5', 'h4')
    await play('a6', 'b7')
    await play('h4', 'h3')
    await play('b7', 'a8')
    await page.get('[data-promotion="N"]').trigger('click')

    expect(page.get('[data-square="a8"]').text()).toContain('♘')
  })

  it('clears a pending selection on reset', async () => {
    const page = await mountSuspended(IndexPage)
    await page.get('[data-square="e2"]').trigger('click')
    await page.get('[data-square="e4"]').trigger('click')
    await page.get('[data-square="e4"]').trigger('click')
    await page.get('[data-testid="reset"]').trigger('click')
    expect(page.findAll('.selected')).toHaveLength(0)
    await page.get('[data-square="d2"]').trigger('click')
    expect(page.get('[data-square="d2"]').classes()).toContain('selected')
  })
})
