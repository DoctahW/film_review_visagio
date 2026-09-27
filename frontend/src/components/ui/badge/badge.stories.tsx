import type { Meta, StoryObj } from '@storybook/react-vite'
import { Clock, Star } from 'lucide-react'

import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  args: { children: 'Drama' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'outline', 'accent'] },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Outline: Story = { args: { variant: 'outline', children: '2019' } }

export const Accent: Story = { args: { variant: 'accent', children: 'Em alta' } }

export const MovieMeta: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="accent">
        <Star aria-hidden className="size-3.5 fill-current" />
        8,6
      </Badge>
      <Badge>Ficção científica</Badge>
      <Badge>Drama</Badge>
      <Badge variant="outline">2014</Badge>
      <Badge variant="outline">
        <Clock aria-hidden className="size-3.5" />
        2h 49min
      </Badge>
    </div>
  ),
}
