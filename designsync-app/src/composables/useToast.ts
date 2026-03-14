import { useToast as useToastification } from 'vue-toastification'

export function useToast() {
  const toast = useToastification()

  const success = (message: string) => {
    toast.success(message)
  }

  const error = (message: string) => {
    toast.error(message)
  }

  const warning = (message: string) => {
    toast.warning(message)
  }

  const info = (message: string) => {
    toast.info(message)
  }

  return {
    success,
    error,
    warning,
    info,
  }
}
