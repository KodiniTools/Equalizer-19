import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UiDialog from '../UiDialog.vue'

let wrapper

function mountDialog(props = {}, slots = {}) {
  wrapper = mount(UiDialog, {
    props: { open: true, title: 'Aufnahme herunterladen', closeLabel: 'Abbrechen', ...props },
    slots: { default: '<p class="body">Inhalt</p>', ...slots },
    attachTo: document.body,
  })
  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('UiDialog', () => {
  it('teleportiert nach body, verknüpft den Titel und fokussiert den Dialog', async () => {
    mountDialog({ icon: 'download' }, { footer: '<button class="ok">OK</button>' })
    await nextTick()
    const dialog = document.body.querySelector('.ui-dialog')
    expect(dialog).not.toBeNull()
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const title = dialog.querySelector('.ui-dialog__title')
    expect(title.textContent).toBe('Aufnahme herunterladen')
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id)
    expect(dialog.querySelector('.ui-dialog__header svg')).not.toBeNull()
    expect(dialog.querySelector('.ui-dialog__body .body').textContent).toBe('Inhalt')
    expect(dialog.querySelector('.ui-dialog__footer .ok')).not.toBeNull()
    expect(document.activeElement).toBe(dialog)
  })

  it('emittiert close über Button, Hintergrund und Escape', async () => {
    mountDialog()
    await nextTick()
    const backdrop = document.body.querySelector('.ui-dialog__backdrop')
    backdrop.querySelector('button[aria-label="Abbrechen"]').click()
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    backdrop
      .querySelector('.ui-dialog')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(3)
  })

  it('rendert nichts, solange open false ist', () => {
    mountDialog({ open: false })
    expect(document.body.querySelector('.ui-dialog')).toBeNull()
  })
})
