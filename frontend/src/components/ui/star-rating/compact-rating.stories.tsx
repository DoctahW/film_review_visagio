import type { Meta, StoryObj } from '@storybook/react-vite'

import { CompactRating } from './compact-rating'

const meta = {
  title: 'UI/CompactRating',
  component: CompactRating,
  args: { value: 5.3, count: 1, className: 'text-sm' },
  argTypes: { variant: { control: 'inline-radio', options: ['full', 'short'] } },
} satisfies Meta<typeof CompactRating>

export default meta
type Story = StoryObj<typeof meta>

export const UmaAvaliacao: Story = {}

export const VariasAvaliacoes: Story = { args: { value: 8.2, count: 1234 } }

export const Curta: Story = { args: { value: 8.2, count: 1234, variant: 'short' } }

export const SemAvaliacoes: Story = { args: { value: null, count: 0 } }
