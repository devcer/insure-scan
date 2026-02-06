import { PremiumLandingPage } from '../lib/components/PremiumLandingPage';
import { ThemeProvider } from '../lib/theme/ThemeProvider';

export default function Home() {
  return (
    <ThemeProvider>
      <PremiumLandingPage />
    </ThemeProvider>
  );
}
