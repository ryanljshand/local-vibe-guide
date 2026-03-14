import { useMemo } from 'react';
import ConciergeFlow from '@/components/ConciergeFlow';
import { type ConciergeContext, getTimeOfDay, getDayName } from '@/lib/concierge';

const Index = () => {
  const ctx = useMemo<ConciergeContext>(() => ({
    city: 'Portland',
    neighborhood: 'Pearl District',
    weather: 'rainy',
    tempF: 58,
    timeOfDay: getTimeOfDay(),
    dayName: getDayName(),
  }), []);

  return <ConciergeFlow ctx={ctx} />;
};

export default Index;
