import { useState, useEffect, useRef } from 'react';

interface FlipDigitProps {
  digit: string;
  prevDigit: string;
}

function FlipDigit({ digit, prevDigit }: FlipDigitProps) {
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setFlipping(true);
      const timer = setTimeout(() => setFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  return (
    <div className={`flip-digit ${flipping ? 'flipping' : ''}`}>
      <div className="flip-digit-inner">
        <span className="flip-digit-value">{digit}</span>
      </div>
    </div>
  );
}

interface FlipCounterProps {
  value: number;
  digits?: number;
}

export default function FlipCounter({ value, digits = 6 }: FlipCounterProps) {
  const [prevDigits, setPrevDigits] = useState<string[]>([]);
  const [currentDigits, setCurrentDigits] = useState<string[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    const padded = String(value).padStart(digits, '0').split('');
    if (!initialized.current) {
      setPrevDigits(padded);
      setCurrentDigits(padded);
      initialized.current = true;
    } else {
      setPrevDigits(currentDigits);
      setCurrentDigits(padded);
    }
  }, [value, digits]);

  return (
    <div className="flip-counter-wrapper">
      <div className="flip-counter-label">Page Visits</div>
      <div className="flip-counter">
        {currentDigits.map((d, i) => (
          <FlipDigit
            key={i}
            digit={d}
            prevDigit={prevDigits[i] || d}
          />
        ))}
      </div>
    </div>
  );
}
