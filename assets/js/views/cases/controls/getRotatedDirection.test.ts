import getRotatedDirection from './getRotatedDirection'

describe('getRotatedDirection', () => {
  it('should return "Heading north" when ArrowUp is pressed with 0 rotation', () => {
    const result = getRotatedDirection('ArrowUp', 0)
    expect(result).toBe('Heading north')
  })

  it('should return "Heading east" when ArrowUp is pressed and map is rotated 90 degrees', () => {
    // 90 degrees in radians is PI / 2
    const rotation = Math.PI / 2
    const result = getRotatedDirection('ArrowUp', rotation)
    expect(result).toBe('Heading east')
  })

  it('should return an empty string for non-arrow keys', () => {
    const result = getRotatedDirection('Enter', 0)
    expect(result).toBe('')
  })

  it('should handle "north" wrap-around at 350 degrees', () => {
    // 350 degrees is near the 360/0 threshold
    const rotationInRadians = (350 * Math.PI) / 180
    const result = getRotatedDirection('ArrowUp', rotationInRadians)
    expect(result).toBe('Heading north')
  })
})
