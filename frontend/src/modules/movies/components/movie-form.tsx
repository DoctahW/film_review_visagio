import { CircleAlert } from 'lucide-react'
import { useId, useRef, useState } from 'react'

import { applyApiErrors, useAppForm } from '@/components/form'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import type { MovieCreate } from '@/lib/api'
import { useGenres } from '@/modules/genres'

import { movieFormSchema, type MovieFormValues } from '../schemas/movie-form.schema'
import { MovieFormPosterPreview } from './movie-form-poster-preview'

type MovieFormProps = {
  initialValues: MovieFormValues
  submitLabel: string
  /** Recebe o corpo já validado (todos os campos, D15); erros da API voltam para o formulário. */
  onSubmit: (body: MovieCreate) => Promise<unknown>
  onCancel?: () => void
}

/** Cadastro e edição de filme: campos à esquerda, prévia do pôster à direita (acima no celular). */
export function MovieForm({ initialValues, submitLabel, onSubmit, onCancel }: MovieFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: genres } = useGenres()
  const formRef = useRef<HTMLFormElement>(null)
  const infoId = useId()
  const detailsId = useId()

  // Leva o foco ao primeiro campo com erro, que pode estar fora da tela no celular.
  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      const control = formRef.current?.querySelector<HTMLElement>(
        '[data-invalid] :is(input, textarea)',
      )
      control?.focus({ preventScroll: true })
      control?.scrollIntoView({ block: 'center' })
    })
  }

  const form = useAppForm({
    defaultValues: initialValues,
    validators: { onSubmit: movieFormSchema },
    onSubmitInvalid: () => {
      setSubmitError(null)
      focusFirstInvalid()
    },
    onSubmit: async ({ value, formApi }) => {
      setSubmitError(null)
      try {
        await onSubmit(movieFormSchema.parse(value))
      } catch (error) {
        // Erros por campo (422) vão para os campos; o resto aparece junto dos botões.
        const message = applyApiErrors(formApi, error)
        if (message) setSubmitError(message)
        else focusFirstInvalid()
      }
    },
  })

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      className="grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start md:gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]"
    >
      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <MovieFormPosterPreview
            url={values.url_poster}
            title={values.titulo}
            year={values.ano_lancamento}
            genres={values.generos}
            className="md:sticky md:top-24 md:col-start-2 md:row-start-1"
          />
        )}
      </form.Subscribe>

      <div className="flex min-w-0 flex-col gap-10 md:col-start-1 md:row-start-1">
        <section aria-labelledby={infoId} className="flex flex-col gap-5">
          <SectionHeading id={infoId}>Informações</SectionHeading>
          <form.AppField name="titulo">
            {(field) => <field.TextField label="Título" autoComplete="off" />}
          </form.AppField>
          <form.AppField name="diretores">
            {(field) => (
              <field.TagsField
                label="Diretores"
                description="Digite o nome e tecle Enter"
                placeholder="Ex.: Greta Gerwig"
                allowCreate
              />
            )}
          </form.AppField>
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <form.AppField name="ano_lancamento">
              {(field) => (
                <field.NumberField label="Ano" placeholder="Ex.: 2024" min={1888} max={2100} />
              )}
            </form.AppField>
            <form.AppField name="duracao_minutos">
              {(field) => (
                <field.NumberField
                  label="Duração em minutos"
                  description="Opcional"
                  placeholder="Ex.: 120"
                  min={1}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="generos">
            {(field) => (
              <field.TagsField
                label="Gêneros"
                description="Escolha da lista ou digite um gênero novo"
                placeholder="Buscar gênero"
                suggestions={genres?.map((genre) => genre.nome_genero)}
                allowCreate
              />
            )}
          </form.AppField>
        </section>

        <section aria-labelledby={detailsId} className="flex flex-col gap-5">
          <SectionHeading id={detailsId}>Pôster e sinopse</SectionHeading>
          <form.AppField name="url_poster">
            {(field) => (
              <field.TextField
                type="url"
                label="URL do pôster"
                description="Link direto para a imagem (opcional)"
                placeholder="https://…"
                autoComplete="off"
              />
            )}
          </form.AppField>
          <form.AppField name="sinopse">
            {(field) => (
              <field.TextareaField
                label="Sinopse"
                placeholder="Sobre o que é o filme (opcional)"
                rows={6}
                maxLength={4000}
              />
            )}
          </form.AppField>
        </section>

        {/* Celular: fixa acima da barra de navegação inferior (64px); desktop: no fim do formulário. */}
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex flex-col border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          {/* Sempre montado: leitores de tela anunciam o texto quando ele entra. */}
          <div role="alert">
            {submitError && (
              <p className="mb-3 flex items-start gap-2 rounded-control bg-danger/10 px-3 py-2.5 text-sm text-danger">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Não foi possível salvar o filme.</span>{' '}
                  {submitError}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-3 md:justify-end">
            {onCancel && (
              <Button variant="ghost" className="flex-1 md:flex-none" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <form.AppForm>
              <form.SubmitButton className="flex-1 md:flex-none" pendingLabel="Salvando…">
                {submitLabel}
              </form.SubmitButton>
            </form.AppForm>
          </div>
        </div>
      </div>
    </form>
  )
}
