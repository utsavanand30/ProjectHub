import type { AxiosError } from 'axios'

interface ErrorMessageProps {
  error: unknown
  fallback?: string
}

export function ErrorMessage({ error, fallback = 'Something went wrong.' }: ErrorMessageProps) {
  let message = fallback

  if (error instanceof Error) {
    const axiosError = error as AxiosError<{ detail: string }>
    message = axiosError.response?.data?.detail ?? axiosError.message ?? fallback
  }

  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-4">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}
