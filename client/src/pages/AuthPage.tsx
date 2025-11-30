// client/src/pages/AuthPage.tsx
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { FiMail, FiUser } from 'react-icons/fi'
import { VscKey } from 'react-icons/vsc'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../hooks/useAuth'

type AuthMode = 'login' | 'register'

interface AuthPageProps {
  mode: AuthMode
}

type AuthField = {
  name: string
  label: string
  type?: string
  icon: ReactNode
}

const AUTH_COPY: Record<
	AuthMode,
	{
		title: string
		submitLabel: string
		redirectPrompt: string
		redirectCta: string
		redirectHref: string
		fields: AuthField[]
		showRemember?: boolean
		forgotHref?: string
	}
> = {
	login: {
		title: 'Sign in',
		submitLabel: 'Sign in',
		redirectPrompt: "Don't have an account?",
		redirectCta: 'Create one',
		redirectHref: '/register',
		fields: [
			{ name: 'email', label: 'Username/Email Address', type: 'email', icon: <FiUser className="text-lg" /> },
			{ name: 'password', label: 'Password', type: 'password', icon: <VscKey className="text-lg" /> },
		],
		showRemember: true,
		forgotHref: '#',
	},
	register: {
		title: 'Register',
		submitLabel: 'Sign up',
		redirectPrompt: 'Already have an account?',
		redirectCta: 'Log in',
		redirectHref: '/login',
		fields: [
			{ name: 'name', label: 'Name', icon: <FiUser className="text-lg" /> },
			{ name: 'email', label: 'Email Address', type: 'email', icon: <FiMail className="text-lg" /> },
			{ name: 'password', label: 'Password', type: 'password', icon: <VscKey className="text-lg" /> },
			{ name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: <VscKey className="text-lg" /> },
		],
	},
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const copy = AUTH_COPY[mode]
  const { loginWithGoogle } = useAuth()
  const isLogin = mode === 'login'
  const primaryButtonClasses =
    'w-full rounded-full border-2 border-transparent bg-motion-yellow py-2 text-[28px] font-semibold text-motion-plum shadow-[0_4px_2px_rgba(0,0,0,0.15)] transition duration-150 hover:border-[#4B0082] hover:shadow-[0_6px_10px_rgba(75,0,130,0.25)] active:border-[#EC6504] active:bg-[#EC6504] active:text-white'
  const initialState = useMemo(
    () =>
      copy.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = ''
        return acc
      }, {}),
    [copy.fields],
  )
  const [formValues, setFormValues] = useState(initialState)

  useEffect(() => {
    setFormValues(initialState)
  }, [initialState])

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault()
    // TODO: hook up to client/src/lib/api.ts once endpoints are ready.
    console.log(`[${mode}] form submission`, formValues)
  }

  const formContent = (
    <div className={`w-full ${isLogin ? 'max-w-3xl' : 'max-w-xl'} px-8 font-satoshi`}>
      {/* Auth form title */}
      <div className="mb-4 text-center">
        <h2 className="text-[44px] font-bold leading-tight text-motion-plum">{copy.title}</h2>
      </div>

      {/* Auth form fields */}
      <form onSubmit={handleSubmit} className={`${isLogin ? 'mt-10 space-y-8' : 'mt-6 space-y-6'}`}>
        {copy.fields.map((field) => (
          /* Individual input */
          <div
            key={field.name}
            className="rounded-[12px] border border-[#f0ebff] bg-white px-5 py-3 shadow-[0_4px_2px_rgba(0,0,0,0.15)] transition-colors focus-within:border-[#5F0589] focus-within:shadow-[0_6px_12px_rgba(95,5,137,0.25)]"
          >
            <div className="flex items-center gap-2.5 text-[#3F3A46] text-[20px]">
              <span aria-hidden>
                {field.icon}
              </span>
              <input
                required
                name={field.name}
                type={field.type ?? 'text'}
                placeholder={field.label}
                aria-label={field.label}
                value={formValues[field.name] ?? ''}
                onChange={handleChange}
                className="w-full border-none bg-transparent text-[20px] font-medium text-[#3F3A46] placeholder:text-[#7E7A88] focus:outline-none"
              />
            </div>
          </div>
        ))}

        {copy.showRemember && (
          /* Remember me + forgot link */
          <div className="mt-6 flex items-center justify-between text-[16px] text-[#4A4359]">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-6 w-6 border border-[#cfc1e9] shadow-[0_4px_2px_rgba(0,0,0,0.15)]"
              />
              Remember Me
            </label>
            <a className="text-motion-plum hover:underline" href={copy.forgotHref}>
              Forgot Password?
            </a>
          </div>
        )}

        {/* Primary submit button */}
        <button type="submit" className={`${primaryButtonClasses} ${isLogin ? 'mt-6' : 'mt-8'}`}>
          {copy.submitLabel}
        </button>
        <div className="my-8" /> {/* nice spacing */}

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-motion-plum/40">
          <span className="h-px flex-1 bg-current" />
          or
          <span className="h-px flex-1 bg-current" />
        </div>

        <button
          type="button"
          onClick={loginWithGoogle}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border-2 border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-800 shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-[0_8px_16px_rgba(0,0,0,0.18)] active:scale-[0.98]"
        >
          <FcGoogle className="text-3xl" />
          <span>{isLogin ? 'Continue' : 'Sign up'} with Google</span>
        </button>
      </form>

      {/* Redirect prompt */}
      <p className="mt-6 text-center text-sm text-motion-plum/80">
        {copy.redirectPrompt}{' '}
        <a href={copy.redirectHref} className="font-semibold text-[#5F0589] underline">
          {copy.redirectCta}
        </a>
      </p>
    </div>
  )
  return (
    <div className="flex min-h-screen font-satoshi text-motion-plum">
      {/* Hero split panel */}
      <section className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-motion-purple px-10 py-20 text-white lg:flex">
        <div className="absolute left-10 top-8 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 text-sm font-semibold">
          Logo
        </div>
        <div className="max-w-xl">
          <h1 className="text-[60px] font-semibold leading-tight text-white">
            Welcome back to{' '}
            <span className="font-bold italic text-motion-yellow whitespace-nowrap">
              Motion.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] text-white/85">
            Discover the motion.
          </p>
        </div>
        {/* Decorative overlapping circles */}
        <div className="pointer-events-none absolute bottom-0 left-0 hidden h-64 w-full lg:block" aria-hidden>
          <span className="absolute -left-16 bottom-4 h-60 w-60 rounded-full bg-[#EC6504]" />  {/*orange*/}
          <span className="absolute left-24 -bottom-16 h-60 w-60 rounded-full bg-motion-yellow" />
          <span className="absolute -left-12 -bottom-24 h-60 w-60 rounded-full bg-[#D7C0FF]" />
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-b from-[#f8f3ff] to-[#f0e7ff] px-4 py-20 md:px-16">
        {formContent}
      </section>
    </div>
  )
  
}

export default AuthPage
