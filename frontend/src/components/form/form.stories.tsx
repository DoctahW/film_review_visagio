import type { Meta, StoryObj } from '@storybook/react-vite'
import { z } from 'zod'

import { useAppForm } from '.'

const classificacoes = [
  { value: 'livre', label: 'Livre' },
  { value: '12', label: '12 anos' },
  { value: '16', label: '16 anos' },
  { value: '18', label: '18 anos' },
] as const

// O formulário guarda `null` em campos vazios; o schema recusa `null` com a mensagem certa.
const filled = (value: unknown) => value !== null

const schema = z.object({
  titulo: z.string().trim().min(1, 'Informe o título.'),
  trailer: z.union([z.literal(''), z.url('Use um link completo, com https://.')]),
  sinopse: z.string().max(300, 'Use no máximo 300 caracteres.'),
  ano: z
    .number()
    .int()
    .min(1888, 'O cinema começou em 1888.')
    .nullable()
    .refine(filled, 'Informe o ano.'),
  diretores: z.array(z.string()).min(1, 'Informe ao menos um diretor.'),
  generos: z.array(z.string()),
  classificacao: z
    .enum(['livre', '12', '16', '18'])
    .nullable()
    .refine(filled, 'Escolha a classificação.'),
  nota: z.number().min(0).max(10).nullable().refine(filled, 'Dê uma nota de 0 a 10.'),
})

type Values = {
  titulo: string
  trailer: string
  sinopse: string
  ano: number | null
  diretores: string[]
  generos: string[]
  classificacao: (typeof classificacoes)[number]['value'] | null
  nota: number | null
}

const defaultValues: Values = {
  titulo: '',
  trailer: '',
  sinopse: '',
  ano: null,
  diretores: [],
  generos: [],
  classificacao: null,
  nota: null,
}

function FieldsDemo() {
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: schema },
    // Simula a latência da API para mostrar o estado de envio.
    onSubmit: () => new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  })

  return (
    <form
      noValidate
      className="flex w-[28rem] max-w-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="titulo">
        {(field) => <field.TextField label="Título" placeholder="Duna: Parte Dois" />}
      </form.AppField>
      <form.AppField name="trailer">
        {(field) => (
          <field.TextField
            label="Trailer"
            type="url"
            placeholder="https://"
            description="Link do YouTube ou Vimeo."
          />
        )}
      </form.AppField>
      <form.AppField name="sinopse">
        {(field) => (
          <field.TextareaField
            label="Sinopse"
            placeholder="Do que se trata o filme?"
            maxLength={300}
          />
        )}
      </form.AppField>
      <form.AppField name="ano">
        {(field) => <field.NumberField label="Ano de lançamento" placeholder="2024" min={1888} />}
      </form.AppField>
      <form.AppField name="diretores">
        {(field) => (
          <field.TagsField
            label="Direção"
            placeholder="Digite um nome e pressione Enter"
            description="Pressione Enter para adicionar cada nome."
          />
        )}
      </form.AppField>
      <form.AppField name="generos">
        {(field) => (
          <field.TagsField
            label="Gêneros"
            placeholder="Escolha ou crie um gênero"
            suggestions={['Ação', 'Aventura', 'Drama', 'Ficção científica', 'Suspense']}
          />
        )}
      </form.AppField>
      <form.AppField name="classificacao">
        {(field) => (
          <field.SelectField
            label="Classificação indicativa"
            items={[...classificacoes]}
            placeholder="Selecione"
          />
        )}
      </form.AppField>
      <form.AppField name="nota">{(field) => <field.RatingField label="Sua nota" />}</form.AppField>
      <form.AppForm>
        <form.SubmitButton pendingLabel="Salvando…" className="self-start">
          Salvar filme
        </form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

const meta = {
  title: 'Form/Fields',
  component: FieldsDemo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FieldsDemo>

export default meta
type Story = StoryObj<typeof meta>

/** Envie vazio para ver os erros do schema; envie preenchido para ver o estado de envio. */
export const TodosOsCampos: Story = { name: 'Todos os campos' }
