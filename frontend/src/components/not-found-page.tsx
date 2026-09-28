import { Link } from '@tanstack/react-router'
import { Popcorn } from 'lucide-react'

import { pageContainer } from '@/components/layout/app-shell'
import { StateMessage } from '@/components/state-message'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NotFoundPageProps = {
  title?: string
  description?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço pode ter mudado ou o conteúdo foi removido.',
}: NotFoundPageProps) {
  return (
    <div className={cn(pageContainer, 'py-16')}>
      <StateMessage
        icon={Popcorn}
        title={title}
        description={description}
        action={
          <Link to="/" className={buttonVariants({ size: 'sm' })}>
            Voltar ao início
          </Link>
        }
      />
    </div>
  )
}
