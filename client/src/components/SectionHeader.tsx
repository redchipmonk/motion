import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

const SectionHeader = ({ title, action }: SectionHeaderProps) => (
  <div className="flex items-center gap-4 mb-6">
    <h3 className="text-3xl font-bold text-motion-plum">{title}</h3>
    {action}
  </div>
);

export default SectionHeader;
