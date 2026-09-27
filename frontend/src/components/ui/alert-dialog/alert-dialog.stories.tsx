import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { ConfirmDialog, type ConfirmDialogProps } from './alert-dialog'

type DemoProps = Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm'> & {
  triggerLabel: string
  /** Simula a requisição: mantém `pending` por este tempo e fecha ao terminar. */
  delayMs?: number
}

function ConfirmDialogDemo({ triggerLabel, delayMs = 1500, tone, ...props }: DemoProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <>
      <Button variant={tone === 'danger' ? 'danger' : 'secondary'} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <ConfirmDialog
        {...props}
        tone={tone}
        open={open}
        onOpenChange={setOpen}
        pending={pending}
        onConfirm={() => {
          setPending(true)
          setTimeout(() => {
            setPending(false)
            setOpen(false)
          }, delayMs)
        }}
      />
    </>
  )
}

const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialogDemo,
  args: {
    triggerLabel: 'Excluir filme',
    title: 'Excluir “Duna: Parte Dois”?',
    description:
      'O filme e todas as avaliações dele serão removidos. Essa ação não pode ser desfeita.',
    confirmLabel: 'Excluir',
    tone: 'danger',
  },
} satisfies Meta<typeof ConfirmDialogDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Destrutivo: Story = {}

export const Neutro: Story = {
  args: {
    triggerLabel: 'Descartar alterações',
    title: 'Descartar alterações?',
    description: 'As edições feitas neste formulário serão perdidas.',
    confirmLabel: 'Descartar',
    cancelLabel: 'Continuar editando',
    tone: 'default',
  },
}

/** Clique em confirmar: o botão mostra o carregamento e o diálogo não fecha até a ação terminar. */
export const RequisicaoLenta: Story = {
  args: { delayMs: 4000 },
}
