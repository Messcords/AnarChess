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
