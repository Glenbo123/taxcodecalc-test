import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { safeRequestAnimationFrame } from '../utils/safeTimer';

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastTap: number;
  dragOffset: Position;
}

export function DraggableCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  
  const calculatorRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastTap: 0,
    dragOffset: { x: 0, y: 0 }
  });

  // Store initial position for reset
  const initialPosition = useRef<Position>({ x: 20, y: 20 });

  useEffect(() => {
    const handleResize = () => {
      if (!calculatorRef.current) return;
      
      const rect = calculatorRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;
      
      setPosition(prev => ({
        x: Math.min(Math.max(10, prev.x), maxX),
        y: Math.min(Math.max(10, prev.y), maxY)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!calculatorRef.current) return;

    const rect = calculatorRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragState.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      lastTap: Date.now(),
      dragOffset: {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    };

    // Check for double tap/click
    const timeSinceLastTap = Date.now() - dragState.current.lastTap;
    if (timeSinceLastTap < 300) {
      resetPosition();
      return;
    }

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!dragState.current.isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    safeRequestAnimationFrame(() => {
      if (!calculatorRef.current) return;

      const rect = calculatorRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;

      const newX = Math.min(Math.max(10, clientX - dragState.current.dragOffset.x), maxX);
      const newY = Math.min(Math.max(10, clientY - dragState.current.dragOffset.y), maxY);

      setPosition({ x: newX, y: newY });
    });
  };

  const stopDrag = () => {
    dragState.current.isDragging = false;
  };

  useEffect(() => {
    if (dragState.current.isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('touchmove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    }

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    };
  }, [dragState.current.isDragging]);

  const resetPosition = () => {
    setPosition({ ...initialPosition.current });
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
            dragState.current.isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {/* Header/Drag Handle */}
          <div
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className="flex items-center justify-between p-3 bg-govuk-blue text-white rounded-t-lg cursor-grab active:cursor-grabbing"
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