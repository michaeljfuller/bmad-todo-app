import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchTodo, type Todo } from '../api/todoApi'
import { TODOS_QUERY_KEY } from './useTodosQuery'

export function usePatchTodoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['todos', 'patch'],
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      patchTodo(id, { completed }),
    retry: false,
    onMutate: async ({ id, completed }) => {
      const previous = queryClient.getQueryData<Todo[]>(TODOS_QUERY_KEY)
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (old) => {
        const list = old ?? []
        return list.map((t) => (t.id === id ? { ...t, completed } : t))
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TODOS_QUERY_KEY, context.previous)
      } else {
        void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
      }
    },
    onSuccess: (todo) => {
      queryClient.setQueryData<Todo[]>(TODOS_QUERY_KEY, (prev) => {
        if (!prev) {
          void queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY })
          return prev
        }
        return prev.map((t) => (t.id === todo.id ? todo : t))
      })
    },
  })
}
