import { useTranslation } from 'react-i18next';
import { LightBulbIcon, GiftIcon, HeartIcon } from '@heroicons/react/24/outline';

interface TaxTip {
  icon: typeof LightBulbIcon;
  title: string;
  description: string;
  link: string;
}

export function TaxSavingTips() {
  const { t } = useTranslation();

  const tips: TaxTip[] = [
    {
      icon: LightBulbIcon,
      title: t('taxTips.pensionContributions'),
      description: t('taxTips.pensionTip'),
      link: 'https://www.gov.uk/tax-on-your-private-pension'
    },
    {
      icon: HeartIcon,
      title: t('taxTips.marriageAllowance'),
      description: t('taxTips.marriageTip'),
      link: 'https://www.gov.uk/marriage-allowance'
    },
    {
      icon: GiftIcon,
      title: t('taxTips.charityDonations'),
      description: t('taxTips.charityTip'),
      link: 'https://www.gov.uk/donating-to-charity'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {t('taxTips.title')}
      </h2>
      <div className="space-y-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex-shrink-0">
              <tip.icon className="h-6 w-6 text-govuk-blue" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {tip.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {tip.description}
              </p>
              <a
                href={tip.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex text-sm text-govuk-blue hover:text-govuk-blue/80 dark:text-govuk-blue dark:hover:text-govuk-blue/80"
              >
                Learn more →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}