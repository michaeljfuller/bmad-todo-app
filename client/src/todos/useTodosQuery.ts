import { useQuery } from '@tanstack/react-query'
import { fetchTodos } from '../api/todoApi'

export const TODOS_QUERY_KEY = ['todos'] as const

export function useTodosQuery() {
  return useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: fetchTodos,
  })
}
