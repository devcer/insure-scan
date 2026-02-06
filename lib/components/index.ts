/**
 * Premium Component Library
 * Export all premium components for easy importing
 */

// Card components
export {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardTitle,
  PremiumCardDescription,
  PremiumCardContent,
  PremiumCardFooter,
  type PremiumCardProps,
  type PremiumCardHeaderProps,
  type PremiumCardTitleProps,
  type PremiumCardDescriptionProps,
  type PremiumCardContentProps,
  type PremiumCardFooterProps,
} from './PremiumCard';

// Button components
export {
  PremiumButton,
  PremiumButtonGroup,
  type PremiumButtonProps,
  type PremiumButtonGroupProps,
} from './PremiumButton';

// Layout components
export {
  PremiumLayout,
  type PremiumLayoutProps,
} from './PremiumLayout';

// Navigation components
export {
  PremiumNavigation,
  type NavigationItem,
  type PremiumNavigationProps,
} from './PremiumNavigation';

export {
  PremiumBreadcrumb,
  PremiumBreadcrumbAuto,
  useBreadcrumbFromPath,
  type BreadcrumbItem,
  type PremiumBreadcrumbProps,
  type PremiumBreadcrumbAutoProps,
} from './PremiumBreadcrumb';

// Form components
export {
  PremiumInput,
  PremiumTextarea,
  PremiumSelect,
  type PremiumInputProps,
  type PremiumTextareaProps,
  type PremiumSelectProps,
} from './PremiumInput';

export {
  PremiumModal,
  type PremiumModalProps,
} from './PremiumModal';

export {
  PolicyForm,
  type PolicyFormProps,
  type PolicyFormData,
} from './PolicyForm';

// Search and Filter components
export {
  PremiumSearch,
  type PremiumSearchProps,
  type SearchSuggestion,
} from './PremiumSearch';

export {
  PremiumFilters,
  type PremiumFiltersProps,
  type FilterGroup,
  type FilterOption,
} from './PremiumFilters';

export {
  FilterChips,
  FilterChipManager,
  type FilterChipsProps,
  type FilterChipManagerProps,
  type FilterChip,
} from './FilterChips';

// Dashboard components
export {
  DashboardStatsCard,
  type DashboardStatsCardProps,
} from './DashboardStatsCard';

export {
  PolicyCard,
  PolicyGrid,
  type PolicyData,
  type PolicyCardProps,
  type PolicyGridProps,
} from './PolicyCard';

// Email components
export {
  PremiumEmailCard,
  PremiumEmailList,
  type EmailMessage,
  type PremiumEmailCardProps,
  type PremiumEmailListProps,
} from './PremiumEmailCard';

export {
  PremiumEmailFilters,
  type EmailFilter,
  type PremiumEmailFiltersProps,
} from './PremiumEmailFilters';

export {
  PremiumEmailsPage,
  type PremiumEmailsPageProps,
} from './PremiumEmailsPage';

export {
  PremiumEmailSwipe,
  BulkActionsToolbar,
  defaultLeftActions,
  defaultRightActions,
  type SwipeAction,
  type PremiumEmailSwipeProps,
  type BulkActionsToolbarProps,
} from './PremiumEmailInteractions';

// Page components
export {
  PremiumPoliciesPage,
  type PremiumPoliciesPageProps,
} from './PremiumPoliciesPage';

// Icons
export {
  PolicyIcon,
  BellIcon,
  CurrencyIcon,
  SparklesIcon,
  ChartIcon,
  ShieldIcon,
  RefreshIcon,
  SpinnerIcon,
  type IconProps,
} from './icons/DashboardIcons';

export {
  HealthInsuranceIcon,
  VehicleInsuranceIcon,
  HomeInsuranceIcon,
  LifeInsuranceIcon,
  TravelInsuranceIcon,
  BusinessInsuranceIcon,
  GeneralInsuranceIcon,
  DisabilityInsuranceIcon,
  PetInsuranceIcon,
  getInsuranceIcon,
  getInsuranceTypeColor,
} from './icons/InsuranceIcons';

// Re-export default components (using different names to avoid conflicts)
export { default as PremiumCardDefault } from './PremiumCard';
export { default as PremiumButtonDefault } from './PremiumButton';
export { default as PremiumNavigationDefault } from './PremiumNavigation';
export { default as PremiumInputDefault } from './PremiumInput';
export { default as PremiumModalDefault } from './PremiumModal';
export { default as PolicyFormDefault } from './PolicyForm';
export { default as PremiumSearchDefault } from './PremiumSearch';
export { default as PremiumFiltersDefault } from './PremiumFilters';
export { default as FilterChipsDefault } from './FilterChips';
export { default as PremiumPoliciesPageDefault } from './PremiumPoliciesPage';
export { default as PremiumEmailCardDefault } from './PremiumEmailCard';
export { default as PremiumEmailFiltersDefault } from './PremiumEmailFilters';
export { default as PremiumEmailsPageDefault } from './PremiumEmailsPage';
export { default as PremiumEmailInteractionsDefault } from './PremiumEmailInteractions';
// Accessibility components
export {
  AccessibilityProvider,
  useAccessibility,
  SkipLink,
  VisuallyHidden,
  FocusRing,
  LiveRegion,
  AccessibilityStatus,
} from './AccessibilityProvider';

export {
  MotionSettings,
  MotionWrapper,
} from './MotionSettings';

// Background Effects components
export {
  BackgroundEffects,
  ParallaxContainer,
  ThemeTransitionOverlay,
  LightingEffects,
  type BackgroundEffectsProps,
  type ParallaxContainerProps,
  type LightingEffectsProps,
} from './BackgroundEffects';

// Celebration and Animation components
export {
  CelebrationAnimation,
  SuccessAnimation,
  MilestoneAchievement,
  LoadingSuccess,
  type CelebrationAnimationProps,
  type SuccessAnimationProps,
  type MilestoneAchievementProps,
  type LoadingSuccessProps,
} from './CelebrationAnimations';

// Animated Charts and Data Visualization
export {
  AnimatedBarChart,
  AnimatedDonutChart,
  AnimatedLineChart,
  AnimatedProgressRing,
  type ChartDataPoint,
  type AnimatedBarChartProps,
  type AnimatedDonutChartProps,
  type LineChartDataPoint,
  type AnimatedLineChartProps,
  type AnimatedProgressRingProps,
} from './AnimatedCharts';

// Premium Landing Page
export { PremiumLandingPage } from './PremiumLandingPage';
