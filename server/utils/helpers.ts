const formatDate = (date: string, format: 'iso' | 'simple') => {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  switch (format) {
    case 'iso': // 'YYYY-MM-DD' - 1990-01-01
      return parsedDate.toISOString().substring(0, 10)
    case 'simple': // 'DD MMMMM YYYY' - 01 January 1990
    default:
      return parsedDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
  }
}
export default formatDate
