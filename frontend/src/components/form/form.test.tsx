import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from '@/lib/api'

import { applyApiErrors, useAppForm } from '.'

const schema = z.object({
  titulo: z.string().trim().min(1, 'Informe o título.'),
  sinopse: z.string(),
})

function MovieForm({ submit }: { submit: (form: { titulo: string; sinopse: string }) => unknown }) {
  const form = useAppForm({
    defaultValues: { titulo: '', sinopse: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await submit(value)
      } catch (error) {
        const message = applyApiErrors(formApi, error)
        if (message) screen.getByTestId('form-error').textContent = message
      }
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="titulo">{(field) => <field.TextField label="Título" />}</form.AppField>
      <form.AppField name="sinopse">
        {(field) => <field.TextareaField label="Sinopse" maxLength={10} />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Salvar</form.SubmitButton>
      </form.AppForm>
      <p data-testid="form-error" />
    </form>
  )
}

const validation422 = (field: string, msg: string) =>
  new ApiError(422, { detail: [{ loc: ['body', field], msg, type: 'value_error' }] })

describe('form kit', () => {
  it('mostra o erro do schema só depois da tentativa de envio', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(<MovieForm submit={submit} />)

    expect(screen.queryByText('Informe o título.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Informe o título.')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true')
    expect(submit).not.toHaveBeenCalled()
  })

  it('conta os caracteres do textarea', async () => {
    const user = userEvent.setup()
    render(<MovieForm submit={vi.fn()} />)

    await user.type(screen.getByLabelText('Sinopse'), 'Duna')

    expect(screen.getByText('4/10')).toBeInTheDocument()
  })

  it('applyApiErrors leva o 422 ao campo e o erro some ao editar', async () => {
    const user = userEvent.setup()
    const submit = vi.fn().mockRejectedValue(validation422('titulo', 'Título já cadastrado.'))
    render(<MovieForm submit={submit} />)
    const titulo = screen.getByLabelText('Título')

    await user.type(titulo, 'Duna')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Título já cadastrado.')).toBeInTheDocument()
    expect(screen.getByTestId('form-error')).toBeEmptyDOMElement()

    await user.type(titulo, '!')
    expect(screen.queryByText('Título já cadastrado.')).not.toBeInTheDocument()
  })

  it('applyApiErrors devolve mensagem quando o erro não tem campo no formulário', async () => {
    const user = userEvent.setup()
    const submit = vi.fn().mockRejectedValue(validation422('orcamento', 'Valor inválido.'))
    render(<MovieForm submit={submit} />)

    await user.type(screen.getByLabelText('Título'), 'Duna')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })
})
