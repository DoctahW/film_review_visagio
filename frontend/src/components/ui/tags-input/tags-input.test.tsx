import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TagsInput, type TagsInputProps } from './tags-input'

function Controlled({
  initial = [],
  onChange,
  ...props
}: Partial<TagsInputProps> & { initial?: string[]; onChange?: (value: string[]) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <TagsInput
      aria-label="Diretores"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

const chipNames = () =>
  screen
    .queryAllByRole('button', { name: /^Remover / })
    .map((button) => button.getAttribute('aria-label'))

describe('TagsInput', () => {
  it('adiciona o texto digitado (sem espaços nas pontas) com Enter e limpa o campo', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const input = screen.getByRole('combobox', { name: 'Diretores' })

    await user.type(input, '  Greta Gerwig  {Enter}')

    expect(chipNames()).toEqual(['Remover Greta Gerwig'])
    expect(input).toHaveValue('')
  })

  it('Enter com texto não submete o formulário', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Controlled />
      </form>,
    )

    await user.type(screen.getByRole('combobox'), 'Nolan{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('ignora duplicatas sem diferenciar maiúsculas', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={['Christopher Nolan']} onChange={onChange} />)
    const input = screen.getByRole('combobox')

    await user.type(input, 'christopher nolan{Enter}')

    expect(onChange).not.toHaveBeenCalled()
    expect(chipNames()).toEqual(['Remover Christopher Nolan'])
    expect(input).toHaveValue('')
  })

  it('usa a grafia da sugestão quando o texto coincide com ela', async () => {
    const user = userEvent.setup()
    render(<Controlled suggestions={['Drama', 'Ficção científica']} />)

    await user.type(screen.getByRole('combobox'), 'drama{Enter}')

    expect(chipNames()).toEqual(['Remover Drama'])
  })

  it('Enter com texto parcial escolhe a primeira sugestão que casa', async () => {
    const user = userEvent.setup()
    render(<Controlled suggestions={['Ação', 'Drama', 'Ficção científica']} />)

    await user.type(screen.getByRole('combobox'), 'dra{Enter}')

    expect(chipNames()).toEqual(['Remover Drama'])
  })

  it('com sugestões, Enter cria o texto que não casa com nenhuma', async () => {
    const user = userEvent.setup()
    render(<Controlled suggestions={['Drama']} />)

    await user.type(screen.getByRole('combobox'), 'Faroeste{Enter}')

    expect(chipNames()).toEqual(['Remover Faroeste'])
  })

  it('sem allowCreate, só aceita sugestões', async () => {
    const user = userEvent.setup()
    render(<Controlled suggestions={['Drama']} allowCreate={false} />)

    await user.type(screen.getByRole('combobox'), 'Faroeste{Enter}')

    expect(chipNames()).toEqual([])
  })

  it('remove a tag pelo botão do chip', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={['Drama', 'Crime']} />)

    await user.click(screen.getByRole('button', { name: 'Remover Drama' }))

    expect(chipNames()).toEqual(['Remover Crime'])
  })

  it('Backspace com o campo vazio remove a última tag', async () => {
    const user = userEvent.setup()
    render(<Controlled initial={['Drama', 'Crime']} />)

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Backspace}')

    expect(chipNames()).toEqual(['Remover Drama'])
  })
})
