import { expect, test } from 'claude-code/testing'
import { pngSize, thumbRows } from '../hooks/png'

// 1x1 PNG
const ONE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

test('pngSize reads IHDR width and height', async () => {
  expect(pngSize(ONE)).toEqual({ width: 1, height: 1 })
  expect(pngSize('bm90IGEgcG5n')).toBeUndefined()
  expect(pngSize('')).toBeUndefined()
})

test('thumbRows follows the aspect and clamps', async () => {
  expect(thumbRows(24, 200, 100)).toBe(6)
  expect(thumbRows(24, 100, 100)).toBe(12)
  expect(thumbRows(24, 1000, 10)).toBe(2)
  expect(thumbRows(24, 10, 1000)).toBe(12)
  expect(thumbRows(24, 0, 0)).toBe(6)
})
