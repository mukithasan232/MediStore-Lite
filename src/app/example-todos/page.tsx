import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Note: Ensure you have a 'todos' table in your Supabase database
  const { data: todos, error } = await supabase.from('todos').select()

  if (error) {
    return (
      <div className="p-8 text-red-500 font-bold">
        Error loading todos: {error.message}
        <p className="text-sm text-gray-500 mt-2 italic">Make sure the 'todos' table exists in your database.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tight uppercase">Example Todo Stream</h1>
      <ul className="space-y-3">
        {todos?.length === 0 ? (
          <li className="text-gray-400 italic">No todos found in the system node.</li>
        ) : (
          todos?.map((todo: any) => (
            <li key={todo.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl font-bold text-gray-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {todo.name}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
