import { useState } from 'react';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { AIChat } from './AIChat';

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[70] bg-govuk-blue hover:bg-govuk-blue/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govuk-blue"
        aria-label="Get help"
      >
        <ComputerDesktopIcon className="h-6 w-6" />
      </button>

      <AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}