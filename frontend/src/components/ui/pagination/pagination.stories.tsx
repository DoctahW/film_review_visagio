import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Pagination } from './pagination'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  args: { page: 1, pages: 5, onPageChange: () => {} },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

function Controlled({ initial, pages }: { initial: number; pages: number }) {
  const [page, setPage] = useState(initial)
  return <Pagination page={page} pages={pages} onPageChange={setPage} />
}

export const FewPages: Story = { render: () => <Controlled initial={2} pages={4} /> }

export const ManyPages: Story = { render: () => <Controlled initial={12} pages={42} /> }

export const FirstPage: Story = { args: { page: 1, pages: 42 } }

export const LastPage: Story = { args: { page: 42, pages: 42 } }

/** Abaixo de `sm` a lista de números some e fica "Página X de Y" entre as setas. */
export const Mobile: Story = {
  args: { page: 7, pages: 42 },
  globals: { viewport: { value: 'mobile1' } },
}
