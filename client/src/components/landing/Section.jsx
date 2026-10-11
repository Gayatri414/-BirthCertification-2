import { motion } from 'framer-motion';

export default function Section({ id, title, subtitle, children, tone = 'white' }) {
  return (
    <section id={id} className={tone === 'muted' ? 'bg-slate-50' : 'bg-white'}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        {title && (
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
}
