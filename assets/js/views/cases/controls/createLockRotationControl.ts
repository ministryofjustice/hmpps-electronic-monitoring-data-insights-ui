import { Control } from 'ol/control'
import { EmMap } from '@ministryofjustice/hmpps-electronic-monitoring-components/map'

const createLockRotationControl = (emMap: EmMap): Control => {
  const btn = document.createElement('button')
  btn.id = 'lock-rotation-btn'
  btn.setAttribute('aria-pressed', 'false')
  btn.setAttribute('aria-label', 'Lock map rotation')
  btn.setAttribute('title', 'Lock rotation')
  btn.textContent = '🔓'

  Object.assign(btn.style, {
    fontSize: '1.14em',
    height: '1.7em',
    width: '1.7em',
    lineHeight: '1.375em',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const element = document.createElement('div')
  element.className = 'lock-rotation-control ol-unselectable ol-control'

  Object.assign(element.style, {
    top: '18.5em',
    left: '0.5em',
    border: 'black solid 1px',
  })

  element.appendChild(btn)

  const control = new Control({ element })

  let isLocked = false

  btn.addEventListener('click', () => {
    isLocked = !isLocked
    btn.setAttribute('aria-pressed', String(isLocked))
    btn.setAttribute('aria-label', isLocked ? 'Unlock map rotation' : 'Lock map rotation')
    btn.setAttribute('title', isLocked ? 'Unlock rotation' : 'Lock rotation')
    btn.textContent = isLocked ? '🔒' : '🔓'
    btn.style.backgroundColor = isLocked ? 'rgba(0, 60, 136, 0.7)' : 'rgba(255, 255, 255, 1)'

    emMap.olMapInstance?.getInteractions().forEach(interaction => {
      if (interaction.constructor.name === 'DragRotate' || interaction.constructor.name === 'PinchRotate') {
        interaction.setActive(!isLocked)
      }
    })

    const rotationStatus = document.querySelector('#map-rotation-status') as HTMLElement
    if (rotationStatus) {
      rotationStatus.textContent = isLocked ? 'Map rotation locked.' : 'Map rotation unlocked.'
    }
  })

  return control
}

export default createLockRotationControl
