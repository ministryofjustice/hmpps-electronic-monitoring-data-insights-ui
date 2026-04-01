const initialiseClearFilters = () => {
  const clearBtn = document.querySelector('#clearFilters')

  clearBtn?.addEventListener('click', e => {
    e.preventDefault()
    window.location.href = window.location.pathname
  })
}
export default initialiseClearFilters
