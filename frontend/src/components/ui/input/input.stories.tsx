import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input, Textarea } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { placeholder: 'Buscar filmes', 'aria-label': 'Buscar filmes' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Preenchido: Story = { args: { defaultValue: 'Duna: Parte Dois' } }

export const Invalido: Story = {
  name: 'Inválido',
  args: { defaultValue: 'nao-e-url', 'aria-invalid': true },
}

export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'Somente leitura' } }

export const AreaDeTexto: Story = {
  name: 'Textarea',
  render: () => (
    <Textarea aria-label="Sinopse" placeholder="Conte do que se trata o filme…" rows={5} />
  ),
}
