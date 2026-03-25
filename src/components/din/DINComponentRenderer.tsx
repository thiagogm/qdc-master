// ========================================
// Componente de renderização no DIN Rail
// Mapeia tipo → componente visual
// ========================================

import type { DINComponent } from '../../types/types';
import { BreakerComponent } from './BreakerComponent';
import { ContactorComponent } from './ContactorComponent';
import { IDRComponent } from './IDRComponent';
import { DPSComponent } from './DPSComponent';

interface DINComponentRendererProps {
  component: DINComponent;
}

export function DINComponentRenderer({ component }: DINComponentRendererProps) {
  switch (component.type) {
    case 'mainBreaker':
    case 'breaker1P':
    case 'breaker2P':
    case 'breaker3P':
      return <BreakerComponent component={component} />;
    case 'contactor':
      return <ContactorComponent component={component} />;
    case 'idr':
      return <IDRComponent component={component} />;
    case 'dps':
      return <DPSComponent component={component} />;
    default:
      return null;
  }
}
