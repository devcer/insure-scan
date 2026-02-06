import { PremiumLandingPage } from '../../lib/components/PremiumLandingPage';
import { ThemeProvider } from '../../lib/theme/ThemeProvider';

export default function LandingPage() {
  return (
    <ThemeProvider>
      <PremiumLandingPage />
    </ThemeProvider>
  );
}
