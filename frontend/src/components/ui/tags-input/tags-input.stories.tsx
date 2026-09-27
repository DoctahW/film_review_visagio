import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { TagsInput, type TagsInputProps } from './tags-input'

function Controlled({
  initial = [],
  ...props
}: Omit<TagsInputProps, 'value' | 'onValueChange'> & { initial?: string[] }) {
  const [value, setValue] = useState(initial)
  return (
    <div className="w-96">
      <TagsInput {...props} value={value} onValueChange={setValue} />
    </div>
  )
}

const meta = {
  title: 'UI/TagsInput',
  component: Controlled,
} satisfies Meta<typeof Controlled>

export default meta
type Story = StoryObj<typeof meta>

export const Diretores: Story = {
  args: {
    'aria-label': 'Diretores',
    placeholder: 'Digite um nome e pressione Enter',
    initial: ['Denis Villeneuve'],
  },
}

export const GenerosComSugestoes: Story = {
  name: 'Gêneros com sugestões',
  args: {
    'aria-label': 'Gêneros',
    placeholder: 'Escolha ou crie um gênero',
    suggestions: ['Ação', 'Aventura', 'Drama', 'Ficção científica', 'Suspense', 'Terror'],
    initial: ['Ficção científica'],
  },
}

export const SomenteSugestoes: Story = {
  name: 'Somente sugestões',
  args: {
    'aria-label': 'Gêneros',
    placeholder: 'Escolha gêneros',
    suggestions: ['Ação', 'Aventura', 'Drama'],
    allowCreate: false,
  },
}

export const Invalido: Story = {
  name: 'Inválido',
  args: { 'aria-label': 'Diretores', placeholder: 'Informe ao menos um diretor', invalid: true },
}
