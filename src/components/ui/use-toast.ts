import * as React from 'react';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast';

export function useToast() {
  const [toast, setToast] = React.useState<{
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const showToast = React.useCallback(
    (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      setToast(props);
      setTimeout(() => setToast(null), 5000);
    },
    []
  );

  const ToastComponent = React.useCallback(
    () => (
      <ToastProvider>
        {toast && (
          <Toast
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onOpenChange={(open) => !open && setToast(null)}
          />
        )}
        <ToastViewport />
      </ToastProvider>
    ),
    [toast]
  );

  return { Toast: ToastComponent, showToast };
}
