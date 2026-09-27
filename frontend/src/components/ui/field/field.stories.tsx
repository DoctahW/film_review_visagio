import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from '@/components/ui/input'

import { Field, FieldDescription, FieldError, FieldLabel } from './field'

const meta = {
  title: 'UI/Field',
  component: Field,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const ComDescricao: Story = {
  name: 'Com descrição',
  render: () => (
    <Field>
      <FieldLabel>Título original</FieldLabel>
      <Input placeholder="Dune: Part Two" />
      <FieldDescription>Como aparece nos créditos do filme.</FieldDescription>
    </Field>
  ),
}

export const ComErroExterno: Story = {
  name: 'Com erro externo',
  render: () => (
    <Field invalid>
      <FieldLabel>Título</FieldLabel>
      <Input defaultValue="" placeholder="Nome do filme" />
      <FieldError match>Informe o título.</FieldError>
    </Field>
  ),
}

export const ValidacaoNativa: Story = {
  name: 'Validação nativa',
  render: () => (
    <form className="flex flex-col gap-3" onSubmit={(event) => event.preventDefault()}>
      <Field>
        <FieldLabel>Trailer</FieldLabel>
        <Input type="url" required placeholder="https://" />
        <FieldError match="valueMissing">Informe o link do trailer.</FieldError>
        <FieldError match="typeMismatch">Use um link completo, com https://.</FieldError>
      </Field>
      <button type="submit" className="self-start text-sm text-primary">
        Validar
      </button>
    </form>
  ),
}
