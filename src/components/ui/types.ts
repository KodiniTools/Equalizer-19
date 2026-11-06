/** Shared prop types of the Ui components. */

export type UiButtonVariant = 'secondary' | 'primary' | 'ghost' | 'outline' | 'danger'
export type UiSize = 'sm' | 'md' | 'lg'

export type UiSegmentedVariant = 'accent' | 'surface'

/** One option of UiSegmentedControl. `title` doubles as aria-label. */
export interface UiSegmentedOption<V extends string | number = string | number> {
  value: V
  label: string
  title?: string
  disabled?: boolean
}

export type UiToastType = 'info' | 'success' | 'warning' | 'error'
