import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/components/ui/button'

import { ToastProvider, useToast } from './toast'

function ToastDemo() {
  const toast = useToast()

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => toast.success('Avaliação publicada')}>Sucesso</Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.success('Filme cadastrado', '“Duna: Parte Dois” já aparece no catálogo.')
        }
      >
        Sucesso com descrição
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toast.error('Não foi possível excluir', 'Verifique sua conexão e tente novamente.')
        }
      >
        Erro
      </Button>
    </div>
  )
}

const meta = {
  title: 'UI/Toast',
  component: ToastDemo,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ToastDemo>

export default meta
type Story = StoryObj<typeof meta>

/** Dispare vários seguidos: a pilha abre ao passar o mouse e cada toast pode ser arrastado para fechar. */
export const Disparos: Story = {
  render: () => (
    <div className="grid min-h-dvh place-items-center p-6">
      <ToastDemo />
    </div>
  ),
}
