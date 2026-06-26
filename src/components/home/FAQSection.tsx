'use client';

import { FAQ_DATA } from '@/lib/constants';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { motion } from 'framer-motion';
import Accordion, { AccordionItem } from '@/components/ui/Accordion';
import { HelpCircle } from 'lucide-react';

const faqItems = FAQ_DATA.map((item) => ({
  id: item.id,
  title: item.question,
  content: item.answer,
  highlight: item.category === 'license',
}));

export default function FAQSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative bg-[#F7F8FA]">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-4xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-500/15 mb-5">
            <HelpCircle className="w-7 h-7 text-brand-light" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            常见问题解答
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            关于萨摩亚牌照优势、三地协同运营、五大业务引擎等常见问题
          </p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Accordion>
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                title={item.title}
                defaultOpen={item.highlight}
              >
                {item.content}
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </section>
  );
}
