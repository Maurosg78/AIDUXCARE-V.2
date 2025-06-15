/**
 * UI COMPONENTS INDEX - AIDUXCARE DESIGN SYSTEM
 * Exportaciones centralizadas del sistema de diseño
 */

// === COMPONENTES DE TIPOGRAFÍA ===
export * from './Typography';

// === COMPONENTES DE ICONOGRAFÍA ===
export * from './Icon';

// === COMPONENTES DE BOTONES ===
export * from './Button';

// === COMPONENTES DE TARJETAS ===
export { 
  Card,
  CardHeader,
  CardTitle as UICardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardVariant,
  type CardSize,
  // Componentes especializados para wireframes
  BenefitCard,
  ClinicalCard,
  PatientInfoCard,
  ClinicalDataCard
} from './Card';

// === COMPONENTES DE FORMULARIOS ===
export * from './Input';
export * from './Textarea';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Radio } from './Radio';
export { Switch } from './Switch';

// === COMPONENTES DE INTERFAZ ===
export { Modal } from './Modal';
export { Drawer } from './Drawer';
export { Tabs } from './Tabs';
export { default as Accordion } from './Accordion';
export { Tooltip } from './Tooltip';
export { Alert } from './Alert';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ActionPanel } from './ActionPanel';
export { ToggleButton } from './ToggleButton';