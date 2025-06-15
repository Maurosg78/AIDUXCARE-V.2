/**
 * AiDuxCare Design System
 * Exportaciones principales del sistema de diseño
 */

// === TOKENS ===
export * from './tokens';

// === TIPOGRAFÍA ===
export {
  Heading,
  Text,
  BodyText,
  Caption,
  Label,
  HeroTitle,
  HeroSubtitle,
  SectionTitle,
  FeatureTitle,
  FeatureDescription,
  FormSectionTitle,
  StatNumber,
  StatLabel,
} from './Typography';

// === ICONOS ===
export {
  Icon,
  BenefitIcon,
  ClinicalStatusIcon,
  RiskLevelIcon,
} from './Icon';
export type { IconName, IconSize, IconVariant } from './Icon';

// === BOTONES ===
export {
  Button,
  CTAPrimaryButton,
  CTASecondaryButton,
  NavButton,
  QuickActionButton,
  FinishConsultationButton,
} from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

// === CARDS Y LAYOUTS ===
export {
  Card,
  BenefitCard,
  StatCard,
  SOAPSectionCard,
  AIAssistantCard,
  PatientHistoryCard,
  AudioTranscriptionCard,
  QuickActionsCard,
  TwoColumnLayout,
  BenefitsGrid,
  StatsGrid,
  PageContainer,
  SectionContainer,
} from './Card';
export type { CardVariant, CardPadding } from './Card'; 