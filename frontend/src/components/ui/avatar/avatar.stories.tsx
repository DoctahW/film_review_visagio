import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar } from './avatar'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  args: { name: 'Greta Gerwig', size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: {
    name: 'Laura Tavares',
    src: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80',
    size: 'lg',
  },
}

export const Initials: Story = {}

/** Imagem quebrada: o Base UI troca pelas iniciais. */
export const BrokenImage: Story = {
  args: { name: 'Denis Villeneuve', src: 'https://invalid.example/foto.jpg' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Fernanda Montenegro" size="sm" />
      <Avatar name="Fernanda Montenegro" size="md" />
      <Avatar name="Fernanda Montenegro" size="lg" />
    </div>
  ),
}

/** O tom de fundo vem do nome: a mesma pessoa sempre tem a mesma cor. */
export const Cast: Story = {
  render: () => (
    <ul className="flex gap-4">
      {['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'].map(
        (name) => (
          <li key={name} className="flex w-20 flex-col items-center gap-2 text-center">
            <Avatar name={name} size="lg" />
            <span className="text-xs text-muted-foreground">{name}</span>
          </li>
        ),
      )}
    </ul>
  ),
}
