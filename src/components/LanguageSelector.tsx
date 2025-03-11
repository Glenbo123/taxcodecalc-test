import { useTranslation } from 'react-i18next';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'cy', name: 'Cymraeg' }
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <Listbox value={currentLanguage.code} onChange={handleLanguageChange}>
        <div className="relative">
          <Listbox.Button className="relative w-24 cursor-pointer rounded-md bg-govuk-blue py-1.5 pl-2 pr-6 text-left text-white shadow-sm ring-1 ring-white/10 hover:bg-govuk-blue/90 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm">
            <span className="block truncate">
              {currentLanguage.name}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
              <ChevronUpDownIcon
                className="h-4 w-4 text-white/70"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Listbox.Options className="absolute bottom-full mb-1 w-24 max-h-60 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {languages.map((language) => (
              <Listbox.Option
                key={language.code}
                value={language.code}
                className={({ active }) =>
                  clsx(
                    'relative cursor-pointer select-none py-2 pl-8 pr-2',
                    active ? 'bg-govuk-blue/10 text-govuk-blue dark:text-white' : 'text-gray-900 dark:text-white'
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                      {language.name}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-govuk-blue">
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  );
}