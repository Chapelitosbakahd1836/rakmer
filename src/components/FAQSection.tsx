'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FAQ_ITEMS = [
  {
    question: 'Como recebo meu ingresso?',
    answer:
      'Imediatamente pelo WhatsApp após a confirmação do pagamento! Você recebe o ingresso digital no seu celular, sem filas e sem complicação.',
  },
  {
    question: 'Posso trocar a data?',
    answer:
      'Sim! Entre em contato pelo nosso WhatsApp com até 24h de antecedência e faremos a troca para a data disponível mais próxima, sem custo adicional.',
  },
  {
    question: 'Aceita PIX?',
    answer:
      'Sim! Aceitamos PIX, cartão de crédito (parcelado em até 12x) e cartão de débito. O pagamento é 100% seguro.',
  },
  {
    question: 'É seguro comprar online?',
    answer:
      'Totalmente seguro! Usamos criptografia SSL e processamento de pagamento via Stripe, a mesma tecnologia utilizada pelos maiores e-commerces do mundo. Seu dados estão 100% protegidos.',
  },
  {
    question: 'Tem meia-entrada?',
    answer:
      'Sim! Estudantes, idosos acima de 60 anos e pessoas com deficiência têm direito à meia-entrada. Basta apresentar o documento comprobatório na entrada do evento.',
  },
]

interface AccordionItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}

function AccordionItem({ question, answer, isOpen, onToggle, index }: AccordionItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
      className="rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: '#1a0810', border: `1px solid ${isOpen ? 'rgba(230,57,70,0.4)' : 'rgba(255,255,255,0.08)'}` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-white/50"
          style={{ color: isOpen ? '#E63946' : undefined }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 text-white/70 leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#0d0408' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#E63946' }}
          >
            FAQ
          </span>
          <h2 className="font-playfair font-bold text-3xl sm:text-4xl text-white mt-2 mb-3">
            Perguntas Frequentes
          </h2>
          <p className="text-white/50">Tudo que você precisa saber antes de comprar</p>
        </div>

        <div>
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              index={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-white/40 text-xs">
          <span className="flex items-center gap-1">🔒 SSL Seguro</span>
          <span className="flex items-center gap-1">💳 Stripe</span>
          <span className="flex items-center gap-1">✅ Compra Garantida</span>
        </div>
      </div>
    </section>
  )
}
