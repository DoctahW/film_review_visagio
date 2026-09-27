import '../src/app/styles.css'

import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  // Gera a página "Docs" (props, tipos e todas as stories) de cada componente.
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Violações de acessibilidade aparecem no painel "Accessibility".
    a11y: { test: 'todo' },
  },
}

export default preview
