import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { CustomButton } from '../components/CustomButton';
import { 
  ExclamationTriangleIcon, 
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  BugAntIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  status: 'unchecked' | 'success' | 'error';
  icon: React.ElementType;
}

export function TroubleshootingGuide() {
  const [steps, setSteps] = useState<TroubleshootingStep[]>([
    {
      id: '1',
      title: 'Calculator Button Visibility',
      description: 'Check if the calculator button/icon is visible in the bottom right corner of your screen.',
      status: 'unchecked',
      icon: ComputerDesktopIcon
    },
    {
      id: '2',
      title: 'Button Interaction',
      description: 'Ensure you\'re clicking/tapping directly on the calculator button and not around it.',
      status: 'unchecked',
      icon: DevicePhoneMobileIcon
    },
    {
      id: '3',
      title: 'Operating System Check',
      description: 'Verify your operating system (Windows, Mac, iOS, Android) and browser version.',
      status: 'unchecked',
      icon: ComputerDesktopIcon
    },
    {
      id: '4',
      title: 'General Functionality',
      description: 'Test if other buttons and application features are working properly.',
      status: 'unchecked',
      icon: BugAntIcon
    },
    {
      id: '5',
      title: 'Error Messages',
      description: 'Note any error messages that appear when clicking the calculator button.',
      status: 'unchecked',
      icon: ExclamationTriangleIcon
    },
    {
      id: '6',
      title: 'Last Working Instance',
      description: 'Document when the calculator last worked correctly.',
      status: 'unchecked',
      icon: ClockIcon
    },
    {
      id: '7',
      title: 'Recent Changes',
      description: 'List any recent system updates or changes that might affect the calculator.',
      status: 'unchecked',
      icon: ArrowPathIcon
    }
  ]);

  const [errorLog, setErrorLog] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<string>('');

  const updateStepStatus = (stepId: string, status: 'success' | 'error') => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleErrorLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setErrorLog(e.target.value);
  };

  const handleSystemInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemInfo(e.target.value);
  };

  const resetChecklist = () => {
    setSteps(steps.map(step => ({ ...step, status: 'unchecked' })));
    setErrorLog('');
    setSystemInfo('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calculator Troubleshooting Guide</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Follow these steps to diagnose and resolve calculator functionality issues
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            {/* Troubleshooting Steps */}
            <div className="space-y-4">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <step.icon className="h-6 w-6 text-govuk-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Step {step.id}: {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStepStatus(step.id, 'success')}
                        className={`p-2 rounded-full ${
                          step.status === 'success' 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => updateStepStatus(step.id, 'error')}
                        className={`p-2 rounded-full ${
                          step.status === 'error' 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Log Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Error Messages
              </label>
              <textarea
                value={errorLog}
                onChange={handleErrorLogChange}
                placeholder="Paste any error messages here..."
                rows={4}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* System Information */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                System Information
              </label>
              <textarea
                value={systemInfo}
                onChange={handleSystemInfoChange}
                placeholder="Enter your system details (OS, browser version, etc.)..."
                rows={4}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-govuk-blue focus:ring-govuk-blue dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <CustomButton
                variant="secondary"
                onClick={resetChecklist}
              >
                Reset Checklist
              </CustomButton>
              <CustomButton
                onClick={() => {
                  // Here you could add functionality to submit the troubleshooting report
                  console.log('Submitting troubleshooting report...');
                }}
              >
                Submit Report
              </CustomButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TroubleshootingGuide;