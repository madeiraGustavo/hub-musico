import { redirect } from 'next/navigation'

/**
 * /login — backward compatibility redirect.
 * Redireciona para /platform/login (tenant padrão).
 */
export default function LoginRedirectPage() {
  redirect('/platform/login')
}
