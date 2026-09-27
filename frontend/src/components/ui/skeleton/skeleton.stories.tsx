import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  args: { className: 'h-4 w-48' },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {}

/** Cartão de filme carregando: pôster 2:3, título e nota. */
export const MovieCard: Story = {
  render: () => (
    <div className="grid w-40 gap-3">
      <Skeleton className="aspect-2/3 w-full rounded-card" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  ),
}

export const Review: Story = {
  render: () => (
    <div className="flex w-80 gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid flex-1 gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  ),
}
