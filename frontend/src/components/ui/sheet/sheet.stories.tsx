import type { Meta, StoryObj } from '@storybook/react-vite'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { Sheet, type SheetProps } from './sheet'

const generos = [
  'Ação',
  'Animação',
  'Comédia',
  'Documentário',
  'Drama',
  'Ficção científica',
  'Terror',
]

function FiltrosFalsos() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Gênero</h3>
        <div className="flex flex-wrap gap-2">
          {generos.map((genero) => (
            <span
              key={genero}
              className="rounded-full bg-surface-raised px-3 py-1.5 text-sm text-muted-foreground"
            >
              {genero}
            </span>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Ano de lançamento</h3>
        <p className="text-sm text-muted-foreground">
          Os campos de ano entram aqui. Role para ver que o cabeçalho e o rodapé ficam fixos.
        </p>
        <div className="h-96 rounded-control bg-surface-raised" />
      </section>
    </div>
  )
}

type DemoProps = Pick<SheetProps, 'title' | 'description'> & { withFooter?: boolean }

function SheetDemo({ withFooter = true, ...props }: DemoProps) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet
      {...props}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="secondary">
          <SlidersHorizontal aria-hidden />
          Filtros
        </Button>
      }
      footer={
        withFooter && (
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Limpar
            </Button>
            <Button onClick={() => setOpen(false)}>Ver resultados</Button>
          </>
        )
      }
    >
      <FiltrosFalsos />
    </Sheet>
  )
}

const meta = {
  title: 'UI/Sheet',
  component: SheetDemo,
  args: {
    title: 'Filtros',
    description: 'Refine o catálogo por gênero e ano.',
  },
} satisfies Meta<typeof SheetDemo>

export default meta
type Story = StoryObj<typeof meta>

/** Redimensione a janela: abaixo de 768px vira folha inferior; acima, painel à direita. */
export const Filtros: Story = {}

export const SemRodape: Story = {
  args: { title: 'Elenco completo', description: undefined, withFooter: false },
}

export const Celular: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
