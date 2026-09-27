import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { StarRating } from './star-rating'

const meta = {
  title: 'UI/StarRating',
  component: StarRating,
  args: { value: 8.2 },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'number', min: 0, max: 10, step: 0.1 } },
  },
} satisfies Meta<typeof StarRating>

export default meta
type Story = StoryObj<typeof meta>

/** Só leitura: a estrela parcial mostra a fração da média (8,2 → 20% da nona estrela). */
export const ReadOnly: Story = {}

export const NoRatings: Story = { args: { value: null } }

const samples = [0, 4.5, 8.2, 10, null]

export const ValuesBySize: Story = {
  render: () => (
    <div className="grid gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="grid gap-2">
          {samples.map((value) => (
            <StarRating key={String(value)} value={value} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
}

export const WithoutValue: Story = { args: { value: 7.4, size: 'sm', showValue: false } }

function InteractiveDemo() {
  const [nota, setNota] = useState<number | null>(null)
  return (
    <div className="grid gap-2">
      <span id="rotulo-nota" className="text-sm font-medium">
        Sua nota
      </span>
      <StarRating value={nota} onChange={setNota} size="lg" aria-labelledby="rotulo-nota" />
      <p className="text-sm text-muted-foreground">
        Clique na metade esquerda para meia estrela. Setas ajustam de 0,5 em 0,5; Home zera.
      </p>
    </div>
  )
}

/** Interativo: passe o mouse para pré-visualizar, clique para escolher ou use o teclado. */
export const Interactive: Story = { render: () => <InteractiveDemo /> }
