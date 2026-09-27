import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Select, type SelectProps } from './select'

const generos = [
  'Ação',
  'Animação',
  'Aventura',
  'Comédia',
  'Crime',
  'Documentário',
  'Drama',
  'Família',
  'Fantasia',
  'Faroeste',
  'Ficção científica',
  'Guerra',
  'História',
  'Mistério',
  'Música',
  'Romance',
  'Suspense',
  'Terror',
  'Thriller',
].map((nome) => ({ value: nome, label: nome }))

function Controlled(props: Omit<SelectProps<string>, 'value' | 'onValueChange'>) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <div className="w-64">
      <Select {...props} value={value} onValueChange={setValue} />
    </div>
  )
}

const meta = {
  title: 'UI/Select',
  component: Controlled,
} satisfies Meta<typeof Controlled>

export default meta
type Story = StoryObj<typeof meta>

export const Genero: Story = {
  name: 'Gênero (lista longa)',
  args: { items: generos, nullLabel: 'Todos os gêneros', 'aria-label': 'Gênero' },
}

export const Ordenacao: Story = {
  name: 'Ordenação',
  args: {
    items: [
      { value: 'nota', label: 'Maior nota' },
      { value: 'lancamento', label: 'Lançamento' },
      { value: 'titulo', label: 'Título' },
    ],
    placeholder: 'Ordenar por',
    'aria-label': 'Ordenar por',
  },
}
