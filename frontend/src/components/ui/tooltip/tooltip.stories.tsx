import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heart, Pencil, Share2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { Tooltip, TooltipProvider } from './tooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  args: {
    label: 'Editar filme',
    children: (
      <Button variant="ghost" size="icon" aria-label="Editar filme">
        <Pencil aria-hidden className="size-5" />
      </Button>
    ),
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}

export const Embaixo: Story = { args: { side: 'bottom' } }

/** Com o provider, depois do primeiro tooltip os vizinhos abrem na hora. */
export const BarraDeAcoes: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-1 rounded-full bg-surface p-1">
        {[
          { label: 'Favoritar', Icon: Heart },
          { label: 'Compartilhar', Icon: Share2 },
          { label: 'Editar', Icon: Pencil },
          { label: 'Excluir', Icon: Trash2 },
        ].map(({ label, Icon }) => (
          <Tooltip key={label} label={label}>
            <Button variant="ghost" size="icon" aria-label={label}>
              <Icon aria-hidden className="size-5" />
            </Button>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
}
