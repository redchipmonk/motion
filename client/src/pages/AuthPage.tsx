import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { FiMail, FiUser } from 'react-icons/fi'
import { VscKey } from 'react-icons/vsc'
import { useGoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { motionTheme, cn } from '../theme'

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
    secondaryAction?: { label: string; onClick?: () => void }
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
    secondaryAction: { label: 'Sign up with Google' },
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
  const isLogin = mode === 'login'
  const primaryButtonClasses = cn(
    'w-full rounded-full border-2 border-transparent bg-motion-yellow py-2 font-semibold transition duration-150',
    motionTheme.typography.authButtonSizeClass,
    motionTheme.text.accent,
    motionTheme.shadows.soft,
    motionTheme.states.primaryHoverBorder,
    motionTheme.shadows.hoverGlow,
    motionTheme.states.primaryActiveBorder,
    motionTheme.states.primaryActiveBg,
    motionTheme.states.primaryActiveText,
  )
  const secondaryButtonClasses = cn(
    'w-full rounded-full border-2 border-motion-plum bg-white py-2 font-semibold text-motion-plum transition duration-150',
    motionTheme.typography.authButtonSizeClass,
    motionTheme.shadows.softLg,
    motionTheme.states.secondaryHoverBorder,
    motionTheme.states.secondaryHoverBg,
    motionTheme.states.secondaryActiveBorder,
    motionTheme.states.secondaryActiveBg,
    motionTheme.states.secondaryActiveText,
  )
  const initialState = useMemo(
    () =>
      copy.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = ''
        return acc
      }, {}),
    [copy.fields],
  )
  const [formValues, setFormValues] = useState(initialState)
  const navigate = useNavigate()

  useEffect(() => {
    setFormValues(initialState)
  }, [initialState])

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('http://localhost:8000/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        })
        const data = await res.json()
        if (res.ok) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          navigate('/') // Redirect to dashboard/home
        } else {
          console.error('Google auth failed:', data.message)
        }
      } catch (err) {
        console.error('Google auth error:', err)
      }
    },
    onError: () => console.error('Google Login Failed'),
  })

  // Hook up the secondary action (Sign up with Google) to the actual handler
  // We need to modify the copy object dynamically or handle it in the click handler
  // But copy is defined outside. Let's patch it in the render or wrap the button.
  // Actually, we can just change the onClick in the copy definition if it was inside the component,
  // but it's outside. We'll override the onClick handler in the button render.

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault()
    const endpoint = mode === 'login' ? 'login' : 'register'
    try {
      const res = await fetch(`http://localhost:8000/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/')
      } else {
        alert(data.message) // Simple error handling for now
      }
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  const formContent = (
    <div className={`w-full ${isLogin ? 'max-w-3xl' : 'max-w-xl'} px-8 ${motionTheme.typography.bodyFontClass}`}>
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
            className={cn(
              'rounded-[12px] border bg-white px-5 py-3 transition-colors',
              motionTheme.borders.authInput,
              motionTheme.shadows.soft,
              motionTheme.states.formFocusBorder,
              motionTheme.shadows.focusWithin,
            )}
          >
            <div className={cn('flex items-center gap-2.5', motionTheme.text.field, motionTheme.typography.authInputSizeClass)}>
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
                className={cn(
                  'w-full border-none bg-transparent font-medium focus:outline-none',
                  motionTheme.typography.authInputSizeClass,
                  motionTheme.text.field,
                  motionTheme.text.placeholder,
                )}
              />
            </div>
          </div>
        ))}

        {copy.showRemember && (
          /* Remember me + forgot link */
          <div className={cn('mt-6 flex items-center justify-between text-[16px]', motionTheme.text.helper)}>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className={cn('h-6 w-6', motionTheme.borders.checkbox, motionTheme.shadows.soft)}
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

        {copy.secondaryAction && (
          <>
            {/* Secondary divider */}
            <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-motion-plum/40">
              <span className="h-px flex-1 bg-current" />
              or
              <span className="h-px flex-1 bg-current" />
            </div>
            {/* Optional secondary button */}
            <button
              type="button"
              className={secondaryButtonClasses}
              onClick={copy.secondaryAction.label.includes('Google') ? () => handleGoogleLogin() : copy.secondaryAction.onClick}
            >
              {copy.secondaryAction.label}
            </button>
          </>
        )}
      </form>

      {/* Redirect prompt */}
      <p className="mt-6 text-center text-sm text-motion-plum/80">
        {copy.redirectPrompt}{' '}
        <a href={copy.redirectHref} className={cn('font-semibold underline', motionTheme.text.accent)}>
          {copy.redirectCta}
        </a>
      </p>
    </div>
  )

  if (isLogin) {
    return (
      <div className={cn('flex min-h-screen text-motion-plum', motionTheme.typography.bodyFontClass)}>
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
            <span className={cn('absolute -left-16 bottom-4 h-60 w-60 rounded-full', motionTheme.accents.orangeCircle)} />  {/*orange*/}
            <span className="absolute left-24 -bottom-16 h-60 w-60 rounded-full bg-motion-yellow" />
            <span className={cn('absolute -left-12 -bottom-24 h-60 w-60 rounded-full', motionTheme.accents.lilacCircle)} />
          </div>
        </section>

        {/* Form panel */}
        <section
          className={cn(
            'flex flex-1 items-center justify-center bg-gradient-to-b px-4 py-20 md:px-16',
            motionTheme.gradients.authBackgroundFrom,
            motionTheme.gradients.authBackgroundTo,
          )}
        >
          {formContent}
        </section>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center bg-gradient-to-b px-4 py-12 text-motion-plum',
        motionTheme.typography.bodyFontClass,
        motionTheme.gradients.authBackgroundFrom,
        motionTheme.gradients.authBackgroundTo,
      )}
    >
      {/* Decorative rails for register layout */}
      <div className="absolute inset-y-0 left-0 hidden w-52 bg-motion-purple md:block" aria-hidden />
      <div className="absolute inset-y-0 right-0 hidden w-52 bg-motion-purple md:block" aria-hidden />
      <div className="relative z-10 w-full max-w-xl">{formContent}</div>
    </div>
  )
}

export default AuthPage
