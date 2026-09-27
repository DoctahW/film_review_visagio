import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown, EllipsisVertical, Pencil, Share2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/ui/alert-dialog'

import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from './menu'

const meta = {
  title: 'UI/Menu',
  component: Menu,
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** Menu de ações de um card: ícone fantasma, item destrutivo separado no fim. */
export const Acoes: Story = {
  render: () => (
    <Menu>
      <MenuTrigger aria-label="Mais ações">
        <EllipsisVertical aria-hidden className="size-5" />
      </MenuTrigger>
      <MenuContent>
        <MenuItem>
          <Pencil aria-hidden />
          Editar
        </MenuItem>
        <MenuItem>
          <Share2 aria-hidden />
          Compartilhar
        </MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger">
          <Trash2 aria-hidden />
          Excluir
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
}

export const GatilhoComTexto: Story = {
  render: () => (
    <Menu>
      <MenuTrigger variant="secondary" size="sm">
        Mais recentes
        <ChevronDown aria-hidden />
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem>Mais recentes</MenuItem>
        <MenuItem>Melhor avaliados</MenuItem>
        <MenuItem disabled>Mais comentados</MenuItem>
      </MenuContent>
    </Menu>
  ),
}

function MenuWithConfirm() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
      <Menu>
        <MenuTrigger aria-label="Mais ações">
          <EllipsisVertical aria-hidden className="size-5" />
        </MenuTrigger>
        <MenuContent>
          <MenuItem>
            <Pencil aria-hidden />
            Editar
          </MenuItem>
          <MenuItem tone="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 aria-hidden />
            Excluir…
          </MenuItem>
        </MenuContent>
      </Menu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir avaliação?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => setConfirmOpen(false)}
      />
    </>
  )
}

/** O item abre um diálogo controlado, como recomenda a doc do Base UI. */
export const AbrindoConfirmacao: Story = {
  render: () => <MenuWithConfirm />,
}
