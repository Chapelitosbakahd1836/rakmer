import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/WhatsAppButton'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Ingressos Circo | Compre Online',
  description:
    'Compre seus ingressos para o circo online com segurança. Emoção, humor e acrobacias para toda a família. PIX, cartão de crédito e débito.',
  openGraph: {
    title: 'Ingressos Circo | Compre Online',
    description:
      'Emoção, humor e acrobacias para toda a família. Garanta já o seu ingresso!',
    images: ['/og-image.jpg'],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
