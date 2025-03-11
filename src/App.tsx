import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageSelector } from './components/LanguageSelector';
import { CrownLogo } from './components/CrownLogo';
import { Sidebar } from './components/Sidebar';
import { Calculator } from './pages/Calculator';
import { HelpButton } from './components/HelpButton';
import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import { Home } from './pages/Home';
import { FloatingCalculator } from './components/FloatingCalculator';
import { DraggableCalculator } from './components/DraggableCalculator';
import { debugRouter } from './utils/debug';

// Lazy load components with consistent naming
const Comparison = lazy(() => import('./pages/Comparison').then(module => ({ default: module.Comparison })));
const Export = lazy(() => import('./pages/Export').then(module => ({ default: module.Export })));
const TaxYears = lazy(() => import('./pages/TaxYears').then(module => ({ default: module.TaxYears })));
const Benefits = lazy(() => import('./pages/Benefits').then(module => ({ default: module.Benefits })));
const Forms = lazy(() => import('./pages/Forms').then(module => ({ default: module.Forms })));
const PayeCalculator = lazy(() => import('./pages/PayeCalculator').then(module => ({ default: module.PayeCalculator })));
const TaxCodesExplained = lazy(() => import('./pages/TaxCodesExplained').then(module => ({ default: module.TaxCodesExplained })));
const TrainingModule = lazy(() => import('./pages/TrainingModule').then(module => ({ default: module.default })));
const CarBenefitCalculator = lazy(() => import('./pages/CarBenefitCalculator').then(module => ({ default: module.CarBenefitCalculator })));
const DatesCalculator = lazy(() => import('./pages/DatesCalculator').then(module => ({ default: module.DatesCalculator })));
const PeriodTaxCalculator = lazy(() => import('./pages/PeriodTaxCalculator'));

function App() {
  const { t } = useTranslation();
  const location = useLocation();

  // Log route changes in development
  useEffect(() => {
    debugRouter('Route changed:', location.pathname);
  }, [location]);

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-govuk-blue animate-pulse flex items-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {t('common.loading')}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-govuk-grey dark:bg-gray-900 transition-colors">
      <header className="bg-govuk-blue dark:bg-primary-900 sticky top-0 z-[60] border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Sidebar />
              <div className="flex items-center ml-3">
                <div className="flex-shrink-0">
                  <CrownLogo />
                </div>
                <div className="border-l border-white/30 pl-4 ml-4">
                  <h1 className="text-xl font-bold text-white leading-tight">
                    HM Revenue & Customs
                  </h1>
                  <h2 className="text-lg text-white/90 font-medium leading-tight">
                    {t('common.taxCalculator')}
                  </h2>
                </div>
              </div>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/export" element={<Export />} />
            <Route path="/tax-years" element={<TaxYears />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/paye-calculator" element={<PayeCalculator />} />
            <Route path="/tax-codes-explained" element={<TaxCodesExplained />} />
            <Route path="/training" element={<TrainingModule />} />
            <Route path="/car-benefit-calculator" element={<CarBenefitCalculator />} />
            <Route path="/dates-calculator" element={<DatesCalculator />} />
            <Route path="/period-tax-calculator" element={<PeriodTaxCalculator />} />
            <Route path="*" element={<Navigate to="/" replace />} aria-label="404 redirect" />
          </Routes>
        </Suspense>
      </main>

      <div className="fixed bottom-0 left-0 z-[70] p-4 bg-govuk-grey dark:bg-gray-900">
        <LanguageSelector />
      </div>
      <div className="fixed-tools">
        <HelpButton />
        <FloatingCalculator />
        <DraggableCalculator />
      </div>
    </div>
  );
}

export default App;