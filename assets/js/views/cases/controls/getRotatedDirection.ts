const getRotatedDirection = (key: string, rotationRadians: number): string => {
  const rotationDeg = (rotationRadians * 180) / Math.PI

  const screenDirections: Record<string, number> = {
    ArrowUp: 0,
    ArrowRight: 90,
    ArrowDown: 180,
    ArrowLeft: 270,
  }
  if (!(key in screenDirections)) return ''

  const adjusted = (screenDirections[key] + rotationDeg + 360) % 360
  if (adjusted < 22.5 || adjusted >= 337.5) return 'Heading north'
  if (adjusted < 67.5) return 'Heading north-east'
  if (adjusted < 112.5) return 'Heading east'
  if (adjusted < 157.5) return 'Heading south-east'
  if (adjusted < 202.5) return 'Heading south'
  if (adjusted < 247.5) return 'Heading south-west'
  if (adjusted < 292.5) return 'Heading west'
  return 'Heading north-west'
}

export default getRotatedDirection
