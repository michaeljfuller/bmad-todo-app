import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTodo } from '../api/todoApi'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['todos', 'delete'],
    mutationFn: (id: number) => deleteTodo(id),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })
}
