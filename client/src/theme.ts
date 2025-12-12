const palette = {
  primaryPurple: '#5F0589',
  deepPurple: '#301071',
  lilac: '#D5B2FF',
  lavender: '#E9DDFF',
  orange: '#EC6504',
  warmWhite: '#F9F6FF',
  yellow: '#FFD446',
  yellowShadow: '#F2C321',
  navLink: '#FFC531',
}

const fontSizeClass = (px: number) => `text-[${px}px]`
const spacingClass = (px: number, axis: 'x' | 'y' | 'm' | 'p' | 'mt' | 'mb' | 'ml' | 'mr' = 'm') =>
  `${axis}-[${px}px]`

export const motionTheme = {
  palette,
  spacing: {
    navMargin: spacingClass(50, 'mb'),
    contentMargin: spacingClass(90, 'mb'),
  },
  radii: {
    button: 'rounded-[25px]',
  },
  typography: {
    bodyFontClass: 'font-[Inter]',
    authButtonSizeClass: fontSizeClass(28),
    authInputSizeClass: fontSizeClass(20),
    sizes: {
      pageTitle: fontSizeClass(60),
      sectionTitle: fontSizeClass(44),
      sectionSubtitle: fontSizeClass(32),
      paragraph: fontSizeClass(24),
      tag: fontSizeClass(24),
      filter: fontSizeClass(20),
      eventRegular: fontSizeClass(20),
      eventMini: fontSizeClass(16),
      smallActions: fontSizeClass(16),
      button: fontSizeClass(28),
    },
  },
  text: {
    field: 'text-[#3F3A46]',
    helper: 'text-[#4A4359]',
    accent: `text-[${palette.primaryPurple}]`,
    placeholder: 'placeholder:text-[#7E7A88]',
  },
  borders: {
    authInput: 'border-[#f0ebff]',
    checkbox: 'border-[#cfc1e9]',
  },
  shadows: {
    soft: 'shadow-[0_4px_4px_rgba(0,0,0,0.15)]',
    softLg: 'shadow-[0_4px_8px_rgba(0,0,0,0.15)]',
    hoverGlow: 'hover:shadow-[0_6px_10px_rgba(75,0,130,0.25)]',
    focusWithin: 'focus-within:shadow-[0_6px_12px_rgba(95,5,137,0.25)]',
    navSearch: 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
    navHoverLift: 'hover:shadow-[0_6px_10px_rgba(0,0,0,0.2)]',
    navFocusRing: 'focus:shadow-[0_0_0_2px_rgba(124,45,210,0.35)]',
  },
  states: {
    primaryHoverBorder: 'hover:border-[#4B0082]',
    primaryActiveBorder: `active:border-[${palette.orange}]`,
    primaryActiveBg: `active:bg-[${palette.orange}]`,
    primaryActiveText: 'active:text-white',
    secondaryHoverBorder: 'hover:border-[#d9d9d9]',
    secondaryHoverBg: 'hover:bg-[#d9d9d9]',
    secondaryActiveBorder: 'active:border-black',
    secondaryActiveBg: 'active:bg-black',
    secondaryActiveText: 'active:text-white',
    formFocusBorder: `focus-within:border-[${palette.primaryPurple}]`,
    navInputFocusBorder: '',
    navIconFocus: `group-focus-within:text-[${palette.primaryPurple}]`,
    navLinkHover: 'hover:text-white',
    navSignOutActiveBg: `active:bg-[${palette.orange}]`,
    navSignOutActiveText: 'active:text-white',
  },
  nav: {
    background: `bg-[${palette.primaryPurple}]`,
    link: `text-[${palette.navLink}]`,
    signOutBg: `bg-[${palette.yellow}]`,
  },
  gradients: {
    authBackgroundFrom: 'from-[#f8f3ff]',
    authBackgroundTo: 'to-[#f0e7ff]',
  },
  accents: {
    orangeCircle: `bg-[${palette.orange}]`,
    lilacCircle: 'bg-[#D7C0FF]',
    deepPurple: `bg-[${palette.deepPurple}]`,
    pastelLilac: `bg-[${palette.lilac}]`,
    pastelLavender: `bg-[${palette.lavender}]`,
    warmWhite: `bg-[${palette.warmWhite}]`,
  },
}

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')
