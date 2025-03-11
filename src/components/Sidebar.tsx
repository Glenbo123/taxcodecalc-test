import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CalculatorIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  GiftIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  HomeIcon,
  CurrencyPoundIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const navigationSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { name: "Home", href: '/', icon: HomeIcon },
      ]
    },
    {
      title: "Calculators",
      items: [
        {
          name: 'Tax Calculators',
          href: '#',
          icon: CalculatorIcon,
          children: [
            { name: 'PAYE Calculator', href: '/paye-calculator', icon: CurrencyPoundIcon },
            { name: 'Period Tax Calculator', href: '/period-tax-calculator', icon: CalculatorIcon },
            { name: t('navigation.comparison'), href: '/comparison', icon: ChartBarIcon },
            { name: 'Car Benefit Calculator', href: '/car-benefit-calculator', icon: BriefcaseIcon },
            { name: 'Dates Calculator', href: '/dates-calculator', icon: ClockIcon },
          ]
        }
      ]
    },
    {
      title: "References",
      items: [
        { name: 'Tax Codes Explained', href: '/tax-codes-explained', icon: DocumentTextIcon },
        { name: t('navigation.taxYears'), href: '/tax-years', icon: CalendarIcon },
        { name: t('navigation.benefits'), href: '/benefits', icon: GiftIcon },
        { name: t('navigation.forms'), href: '/forms', icon: ClipboardDocumentListIcon },
      ]
    },
    {
      title: "Tools",
      items: [
        {
          name: 'Training',
          href: '#',
          icon: AcademicCapIcon,
          children: [
            { name: 'Training Module', href: '/training', icon: AcademicCapIcon },
            { name: 'Practice Scenarios', href: '/comparison', icon: UserGroupIcon },
          ]
        },
        { name: t('navigation.export'), href: '/export', icon: DocumentDuplicateIcon },
      ]
    }
  ];

  const NavItem = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const isExpanded = expandedItems.has(item.name);
    const isActive = location.pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children?.some(child => location.pathname === child.href);

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.name)}
            className={clsx(
              'w-full flex items-center justify-between',
              'group rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
              (isActive || isChildActive) ? 'bg-govuk-blue/10 text-govuk-blue dark:bg-govuk-blue/20 dark:text-white' :
              'text-gray-700 dark:text-gray-300 hover:text-govuk-blue hover:bg-govuk-blue/5 dark:hover:bg-govuk-blue/10'
            )}
            style={{ paddingLeft: `${depth * 1}rem` }}
          >
            <span className="flex items-center gap-x-3">
              <item.icon
                className={clsx(
                  'h-5 w-5 shrink-0 transition-colors',
                  (isActive || isChildActive) ? 'text-govuk-blue dark:text-white' :
                  'text-gray-400 group-hover:text-govuk-blue dark:group-hover:text-white'
                )}
              />
              {item.name}
            </span>
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="ml-4 space-y-1">
              {item.children.map((child) => (
                <NavItem key={child.name} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.href}
        className={clsx(
          'flex items-center gap-x-3',
          'group rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
          isActive ? 'bg-govuk-blue/10 text-govuk-blue dark:bg-govuk-blue/20 dark:text-white' :
          'text-gray-700 dark:text-gray-300 hover:text-govuk-blue hover:bg-govuk-blue/5 dark:hover:bg-govuk-blue/10'
        )}
        style={{ paddingLeft: `${depth * 1}rem` }}
        onClick={() => setIsMenuOpen(false)}
      >
        <item.icon
          className={clsx(
            'h-5 w-5 shrink-0 transition-colors',
            isActive ? 'text-govuk-blue dark:text-white' :
            'text-gray-400 group-hover:text-govuk-blue dark:group-hover:text-white'
          )}
        />
        {item.name}
      </Link>
    );
  };

  const NavLinks = () => (
    <div className="space-y-6">
      {navigationSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {section.title}
          </h3>
          <ul role="list" className="-mx-2 space-y-1">
            {section.items.map((item) => (
              <li key={item.name}>
                <NavItem item={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="text-white hover:text-white/80 focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="sr-only">Toggle menu</span>
        {isMenuOpen ? (
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      <div
        className={clsx(
          'fixed inset-0 z-[55] transition-transform duration-300 ease-in-out transform',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75" 
          onClick={() => setIsMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
              <NavLinks />
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}