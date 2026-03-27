import OlMap from 'ol/Map'

export const initialiseClearFilters = () => {
  const clearBtn = document.querySelector('#clearFilters')
  
  clearBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    // TODO: Do we want to do this check
    window.location.href = window.location.pathname

    // const form = document.querySelector('#dateFilterForm') as HTMLFormElement
    // if (form) {
    //   form.querySelectorAll('input[type="text"], input:not([type="hidden"])').forEach(input => {
    //     (input as HTMLInputElement).value = ''
    //   })
    // }

    // const emMap = document.querySelector('em-map') as HTMLElement & { olMapInstance?: OlMap }
    // const map = emMap?.olMapInstance

    // if (map) {
    //   map.getView().setRotation(0)
    // }
  })
}