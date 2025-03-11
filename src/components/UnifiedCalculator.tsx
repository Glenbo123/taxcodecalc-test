import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { safeRequestAnimationFrame } from '../utils/safeTimer';

interface CalculatorProps {
  mode: 'fixed' | 'floating' | 'draggable';
  initialPosition?: { x: number; y: number };
  defaultVisible?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
  className?: string;
}

interface CalculatorState {
  position: { x: number; y: number };
  isDragging: boolean;
  isVisible: boolean;
  expression: string;
  result: string;
  memory: string | null;
  operator: string | null;
  history: { expression: string; result: string }[];
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastTap: number;
  dragOffset: { x: number; y: number };
}

export function UnifiedCalculator({
  mode = 'fixed',
  initialPosition = { x: 20, y: 20 },
  defaultVisible = false,
  onPositionChange,
  className
}: CalculatorProps) {
  // State
  const [state, setState] = useState<CalculatorState>({
    position: initialPosition,
    isDragging: false,
    isVisible: defaultVisible,
    expression: '0',
    result: '',
    memory: null,
    operator: null,
    history: []
  });

  // Refs
  const calculatorRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    lastTap: 0,
    dragOffset: { x: 0, y: 0 }
  });
  const initialPositionRef = useRef(initialPosition);

  // Window resize handler
  useEffect(() => {
    if (mode !== 'fixed') {
      const handleResize = () => {
        if (!calculatorRef.current) return;
        
        const rect = calculatorRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width - 10;
        const maxY = window.innerHeight - rect.height - 10;
        
        setState(prev => ({
          ...prev,
          position: {
            x: Math.min(Math.max(10, prev.position.x), maxX),
            y: Math.min(Math.max(10, prev.position.y), maxY)
          }
        }));
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [mode]);

  // Keyboard input handler
  useEffect(() => {
    if (state.isVisible) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (!state.isDragging) {
          if (/[0-9.]/.test(e.key)) {
            handleNumberInput(e.key);
          } else if (['+', '-', '*', '/', '=', 'Enter'].includes(e.key)) {
            handleOperatorInput(e.key === 'Enter' ? '=' : e.key);
          } else if (e.key === 'Escape') {
            handleClear();
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [state.isVisible, state.isDragging]);

  // Drag handlers
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!calculatorRef.current || mode === 'fixed') return;

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

    setState(prev => ({ ...prev, isDragging: true }));
    e.preventDefault();
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!dragState.current.isDragging || mode === 'fixed') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    safeRequestAnimationFrame(() => {
      if (!calculatorRef.current) return;

      const rect = calculatorRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 10;
      const maxY = window.innerHeight - rect.height - 10;

      const newPosition = {
        x: Math.min(Math.max(10, clientX - dragState.current.dragOffset.x), maxX),
        y: Math.min(Math.max(10, clientY - dragState.current.dragOffset.y), maxY)
      };

      setState(prev => ({ ...prev, position: newPosition }));
      onPositionChange?.(newPosition);
    });
  };

  const stopDrag = () => {
    dragState.current.isDragging = false;
    setState(prev => ({ ...prev, isDragging: false }));
  };

  useEffect(() => {
    if (state.isDragging) {
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
  }, [state.isDragging]);

  // Calculator functions
  const handleNumberInput = (num: string) => {
    setState(prev => {
      const newExpression = prev.expression === '0' || prev.operator === '=' 
        ? num 
        : prev.expression + num;
      
      return {
        ...prev,
        expression: newExpression,
        operator: null
      };
    });
  };

  const handleOperatorInput = (op: string) => {
    setState(prev => {
      if (op === '=') {
        try {
          const result = calculateExpression(prev.expression);
          return {
            ...prev,
            expression: result.toString(),
            result: '',
            operator: '=',
            history: [...prev.history, { 
              expression: prev.expression, 
              result: result.toString() 
            }]
          };
        } catch (error) {
          return {
            ...prev,
            expression: 'Error',
            result: '',
            operator: null
          };
        }
      } else {
        return {
          ...prev,
          memory: prev.expression,
          operator: op,
          expression: '0'
        };
      }
    });
  };

  const handleClear = () => {
    setState(prev => ({
      ...prev,
      expression: '0',
      result: '',
      memory: null,
      operator: null
    }));
  };

  const calculateExpression = (expr: string): number => {
    // Safe evaluation of mathematical expressions
    try {
      // eslint-disable-next-line no-new-func
      return Function(`'use strict'; return (${expr})`)();
    } catch (error) {
      throw new Error('Invalid expression');
    }
  };

  const resetPosition = () => {
    setState(prev => ({
      ...prev,
      position: initialPositionRef.current
    }));
    onPositionChange?.(initialPositionRef.current);
  };

  // Render calculator button
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

  // Render calculator content
  const CalculatorContent = () => (
    <div 
      ref={calculatorRef}
      style={mode !== 'fixed' ? {
        transform: `translate(${state.position.x}px, ${state.position.y}px)`,
      } : undefined}
      className={clsx(
        "w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl",
        "border border-gray-200 dark:border-gray-700",
        mode === 'fixed' ? className : "fixed z-[75]",
        state.isDragging && mode === 'draggable' && "cursor-grabbing"
      )}
    >
      {/* Header */}
      <div
        onMouseDown={mode === 'draggable' ? startDrag : undefined}
        onTouchStart={mode === 'draggable' ? startDrag : undefined}
        className={clsx(
          "flex items-center justify-between p-3 bg-govuk-blue text-white rounded-t-lg",
          mode === 'draggable' && "cursor-grab active:cursor-grabbing"
        )}
      >
        <span className="text-sm font-medium">Calculator</span>
        {mode !== 'fixed' && (
          <button
            onClick={() => setState(prev => ({ ...prev, isVisible: false }))}
            className="text-white/80 hover:text-white"
            aria-label="Close calculator"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Display */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 h-4">
            {state.memory && `${state.memory} ${state.operator}`}
          </div>
          <div className="text-2xl font-mono text-gray-900 dark:text-white">
            {state.expression}
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="p-2 grid grid-cols-4 gap-1">
        <Button onClick={handleClear} className="text-red-600">C</Button>
        <Button onClick={() => handleOperatorInput('%')}>%</Button>
        <Button onClick={() => handleOperatorInput('/')}>/</Button>
        <Button onClick={() => handleOperatorInput('*')}>×</Button>

        <Button onClick={() => handleNumberInput('7')}>7</Button>
        <Button onClick={() => handleNumberInput('8')}>8</Button>
        <Button onClick={() => handleNumberInput('9')}>9</Button>
        <Button onClick={() => handleOperatorInput('-')}>-</Button>

        <Button onClick={() => handleNumberInput('4')}>4</Button>
        <Button onClick={() => handleNumberInput('5')}>5</Button>
        <Button onClick={() => handleNumberInput('6')}>6</Button>
        <Button onClick={() => handleOperatorInput('+')}>+</Button>

        <Button onClick={() => handleNumberInput('1')}>1</Button>
        <Button onClick={() => handleNumberInput('2')}>2</Button>
        <Button onClick={() => handleNumberInput('3')}>3</Button>
        <Button 
          onClick={() => handleOperatorInput('=')}
          className="bg-govuk-blue text-white hover:bg-govuk-blue/90 row-span-2"
        >=</Button>

        <Button onClick={() => handleNumberInput('0')} className="col-span-2">0</Button>
        <Button onClick={() => handleNumberInput('.')}>.</Button>
      </div>
    </div>
  );

  // Render based on mode
  if (mode === 'fixed') {
    return <CalculatorContent />;
  }

  return (
    <>
      {/* Toggle button for floating/draggable modes */}
      {!state.isVisible && (
        <button
          onClick={() => setState(prev => ({ ...prev, isVisible: true }))}
          className="fixed bottom-20 right-4 z-[70] bg-govuk-blue hover:bg-govuk-blue/90 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Open calculator"
        >
          <CalculatorIcon className="h-6 w-6" />
        </button>
      )}

      {/* Calculator */}
      {state.isVisible && <CalculatorContent />}
    </>
  );
}