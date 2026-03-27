import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from './Button';
import { Card } from './Card';

type PremiumFeatureGateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel?: string;
};

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  eyebrow = 'Premium feature',
  title,
  description,
  ctaLabel = 'Upgrade in Billing',
}) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="gradient"
      className="overflow-hidden border border-[#00FF88]/15 bg-[linear-gradient(135deg,rgba(16,24,34,0.96)_0%,rgba(20,18,35,0.98)_100%)]"
    >
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-[#00FF88]/20 bg-[#00FF88]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7fffc3]">
          {eyebrow}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black leading-tight text-[#F7F7F7]">{title}</h3>
          <p className="max-w-2xl text-sm leading-7 text-[#aeb7cb]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="accent" onClick={() => navigate('/billing')}>
            {ctaLabel}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
};
