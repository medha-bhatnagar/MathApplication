import type { ReactNode } from 'react'

type MessageKind = 'error' | 'warning' | 'success' | 'feedback'

export function Message({ kind, children }: { kind: MessageKind; children: ReactNode }) {
  return (
    <p className={`${kind}-message`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}
