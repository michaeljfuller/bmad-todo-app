import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTodo } from '../api/todoApi'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function useCreateTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['todos', 'create'],
    mutationFn: (text: string) => createTodo({ text }),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
    },
  })
}
