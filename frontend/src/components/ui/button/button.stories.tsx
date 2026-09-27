import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Salvar' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'icon'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancelar' } }

export const Ghost: Story = { args: { variant: 'ghost', children: 'Limpar filtros' } }

export const Danger: Story = { args: { variant: 'danger', children: 'Excluir' } }

export const Disabled: Story = { args: { disabled: true } }
