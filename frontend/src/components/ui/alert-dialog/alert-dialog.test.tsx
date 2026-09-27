import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './alert-dialog'

function setup(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title="Excluir avaliação?"
      description="Essa ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={onConfirm}
      {...props}
    />,
  )
  return { onConfirm, onOpenChange, user: userEvent.setup() }
}

describe('ConfirmDialog', () => {
  it('mostra título e descrição como nome e descrição acessíveis', () => {
    setup()
    const dialog = screen.getByRole('alertdialog', { name: 'Excluir avaliação?' })
    expect(dialog).toHaveAccessibleDescription('Essa ação não pode ser desfeita.')
  })

  it('confirma sem fechar sozinho', async () => {
    const { onConfirm, onOpenChange, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('cancelar pede para fechar', async () => {
    const { onOpenChange, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('enquanto pendente, bloqueia confirmar, cancelar e Esc', async () => {
    const { onConfirm, onOpenChange, user } = setup({ pending: true })
    const confirm = screen.getByRole('button', { name: 'Excluir' })
    expect(confirm).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

    await user.click(confirm)
    await user.keyboard('{Escape}')
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
