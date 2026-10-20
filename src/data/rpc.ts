import { parseRepositoryError } from './boardMapper'
import { RepositoryError } from './boardRepository'
import { supabase } from './supabaseClient'

/** RPC를 호출하고 서버 오류 메시지(코드)를 RepositoryError로 바꾼다. */
export async function callRpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new RepositoryError(parseRepositoryError(error.message), error.message)
  return data
}
