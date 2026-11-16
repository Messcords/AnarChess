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
    await page.get('[data-square="d1"]').trigger('click')
    await page.get('[data-square="d8"]').trigger('click')
    expect(page.findAll('.piece')).toHaveLength(31)
    await page.get('[data-testid="reset"]').trigger('click')
    expect(page.findAll('.piece')).toHaveLength(32)
    expect(page.get('[data-square="d8"]').text()).toContain('♛')
    expect(page.get('[data-square="d1"]').text()).toContain('♕')
  })
})
