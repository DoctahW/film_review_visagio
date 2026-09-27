import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { NumberInput, type NumberInputProps } from './number-input'

function Controlled(
  props: Omit<NumberInputProps, 'value' | 'onValueChange'> & { initial?: number },
) {
  const { initial = null, ...rest } = props
  const [value, setValue] = useState<number | null>(initial)
  return (
    <div className="flex w-64 flex-col gap-2">
      <NumberInput {...rest} value={value} onValueChange={setValue} />
      <p className="text-sm text-muted-foreground">Valor: {value ?? 'vazio'}</p>
    </div>
  )
}

const meta = {
  title: 'UI/NumberInput',
  component: Controlled,
} satisfies Meta<typeof Controlled>

export default meta
type Story = StoryObj<typeof meta>

export const Ano: Story = {
  args: {
    'aria-label': 'Ano de lançamento',
    placeholder: '2024',
    min: 1888,
    max: 2100,
    initial: 2024,
  },
}

export const ComBotoes: Story = {
  name: 'Com botões',
  args: {
    'aria-label': 'Duração em minutos',
    placeholder: '120',
    min: 1,
    steppers: true,
    initial: 166,
  },
}

export const Vazio: Story = {
  args: { 'aria-label': 'Orçamento', placeholder: 'Em dólares', min: 0 },
}
