import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface Position {
  x: number;
  y: number;
}

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const startDragging = (e: React.MouseEvent) => {
    if (!calculatorRef.current) return;
    
    const rect = calculatorRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleNumberClick = (num: string) => {
    setDisplay(prev => {
      if (prev === '0' || operator === '=') {
        return num;
      }
      return prev + num;
    });
  };

  const handleOperatorClick = (op: string) => {
    if (op === '=') {
      if (memory && operator) {
        try {
          const result = calculate(parseFloat(memory), parseFloat(display), operator);
          setDisplay(result.toString());
          setMemory(null);
          setOperator('=');
        } catch (error) {
          setDisplay('Error');
          setMemory(null);
          setOperator(null);
        }
      }
    } else {
      setMemory(display);
      setOperator(op);
      setDisplay('0');
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': 
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      case '%': return (a * b) / 100;
      default: return b;
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setMemory(null);
    setOperator(null);
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const Button = ({ children, onClick, className }: { 
    children: React.ReactNode; 
    onClick: () => void;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        "p-2 text-sm font-medium rounded-md transition-colors",
        "hover:bg-govuk-blue/10 active:bg-govuk-blue/20",
        "focus:outline-none focus:ring-2 focus:ring-govuk-blue focus:ring-offset-1",
        className
      )}
    >
      {children}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[70] bg-govuk-blue hover:bg-govuk-blue/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Open calculator"
      >
        <CalculatorIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          ref={calculatorRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
          className={clsx(
            "fixed z-[75] w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl",
            "border border-gray-200 dark:border-gray-700",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {/* Header/Drag Handle */}
          <div
            onMouseDown={startDragging}
            className="flex items-center justify-between p-3 bg-govuk-blue text-white rounded-t-lg"
          >
            <span className="text-sm font-medium">Calculator</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Close calculator"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Display */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 h-4">
                {memory && `${memory} ${operator}`}
              </div>
              <div className="text-2xl font-mono text-gray-900 dark:text-white">
                {display}
              </div>
            </div>
          </div>

          {/* Keypad */}
          <div className="p-2 grid grid-cols-4 gap-1">
            {/* First row */}
            <Button onClick={handleClear} className="text-red-600">C</Button>
            <Button onClick={() => handleOperatorClick('%')}>%</Button>
            <Button onClick={() => handleOperatorClick('/')}>/</Button>
            <Button onClick={() => handleOperatorClick('*')}>×</Button>

            {/* Number pad and operators */}
            <Button onClick={() => handleNumberClick('7')}>7</Button>
            <Button onClick={() => handleNumberClick('8')}>8</Button>
            <Button onClick={() => handleNumberClick('9')}>9</Button>
            <Button onClick={() => handleOperatorClick('-')}>-</Button>

            <Button onClick={() => handleNumberClick('4')}>4</Button>
            <Button onClick={() => handleNumberClick('5')}>5</Button>
            <Button onClick={() => handleNumberClick('6')}>6</Button>
            <Button onClick={() => handleOperatorClick('+')}>+</Button>

            <Button onClick={() => handleNumberClick('1')}>1</Button>
            <Button onClick={() => handleNumberClick('2')}>2</Button>
            <Button onClick={() => handleNumberClick('3')}>3</Button>
            <Button 
              onClick={() => handleOperatorClick('=')}
              className="bg-govuk-blue text-white hover:bg-govuk-blue/90 row-span-2"
            >=</Button>

            <Button onClick={() => handleNumberClick('0')} className="col-span-2">0</Button>
            <Button onClick={handleDecimal}>.</Button>
          </div>
        </div>
      )}
    </>
  );
}