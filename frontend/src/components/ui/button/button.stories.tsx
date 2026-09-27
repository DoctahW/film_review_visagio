import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heart, Pencil, Play, Plus, Share2 } from 'lucide-react'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Salvar' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost', 'danger', 'glass'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon', 'icon-sm'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancelar' } }

export const Ghost: Story = { args: { variant: 'ghost', children: 'Limpar filtros' } }

export const Danger: Story = { args: { variant: 'danger', children: 'Excluir' } }

export const Disabled: Story = { args: { disabled: true } }

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus aria-hidden className="size-4" />
        Adicionar filme
      </>
    ),
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Avaliar</Button>
      <Button variant="secondary">Editar</Button>
      <Button variant="ghost">Limpar filtros</Button>
      <Button variant="danger">Excluir</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
      <Button size="icon" variant="secondary" aria-label="Editar">
        <Pencil aria-hidden className="size-5" />
      </Button>
      <Button size="icon-sm" variant="secondary" aria-label="Editar">
        <Pencil aria-hidden className="size-4" />
      </Button>
    </div>
  ),
}

/** `glass` fica sobre imagens (pôster, backdrop): fundo translúcido com desfoque. */
export const GlassOverImage: Story = {
  render: () => (
    <div className="relative flex h-64 w-96 items-end overflow-hidden rounded-card bg-linear-to-br from-amber-700 via-rose-900 to-indigo-950 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="glass" size="icon" aria-label="Favoritar">
          <Heart aria-hidden className="size-5" />
        </Button>
        <Button variant="glass" size="icon" aria-label="Compartilhar">
          <Share2 aria-hidden className="size-5" />
        </Button>
      </div>
      <Button variant="glass">
        <Play aria-hidden className="size-4" />
        Ver trailer
      </Button>
    </div>
  ),
}
