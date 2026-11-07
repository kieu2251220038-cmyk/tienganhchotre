import { useEffect } from 'react';

interface FireworksCelebrationProps {
  visible: boolean;
  eventKey: number;
  onDone: () => void;
}

const burstColors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF'];
const burstPositions = [
  { left: '18%', top: '30%' },
  { left: '38%', top: '18%' },
  { left: '62%', top: '18%' },
  { left: '82%', top: '30%' },
  { left: '50%', top: '42%' }
];
const confettiColors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF8A00'];

export default function FireworksCelebration({ visible, eventKey, onDone }: FireworksCelebrationProps) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(timer);
  }, [visible, eventKey, onDone]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes fireworksMessage {
          0% { transform: translate(-50%, -50%) scale(.55); opacity: 0; }
          18% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          72% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -65%) scale(.92); opacity: 0; }
        }
        @keyframes fireworksConfetti {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fireworksSpark {
          0% { opacity: 0; filter: brightness(1); }
          18% { opacity: 1; filter: brightness(1.8); }
          75% { opacity: 1; filter: brightness(1); }
          100% { opacity: 0; filter: brightness(1); }
        }
        .fireworks-message {
          position: absolute;
          left: 50%;
          top: 43%;
          padding: 14px 26px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 4px solid #FFC800;
          box-shadow: 0 8px 0 #E5B400, 0 12px 32px rgba(15, 23, 42, .2);
          color: #166534;
          font: 800 31px Fredoka, sans-serif;
          white-space: nowrap;
          animation: fireworksMessage 1.6s ease-out forwards;
        }
        .fireworks-burst {
          position: absolute;
          width: 14px;
          height: 14px;
          animation: fireworksSpark 1.15s ease-out forwards;
        }
        .fireworks-spark {
          position: absolute;
          left: 3px;
          top: 3px;
          width: 9px;
          height: 34px;
          border-radius: 999px;
          transform-origin: 50% 0;
        }
        .fireworks-confetti {
          position: absolute;
          top: -28px;
          width: 12px;
          height: 22px;
          border-radius: 4px;
          animation: fireworksConfetti 1.6s ease-in forwards;
        }
      `}</style>

      {burstPositions.map((position, burstIndex) => (
        <div
          key={`${eventKey}-${burstIndex}`}
          className="fireworks-burst"
          style={{ left: position.left, top: position.top }}
        >
          {Array.from({ length: 18 }, (_, index) => (
            <span
              key={index}
              className="fireworks-spark"
              style={{
                transform: `rotate(${index * (360 / 18)}deg) translateY(-${58 + (burstIndex * 8)}px)`,
                backgroundColor: burstColors[(index + burstIndex) % burstColors.length],
                animationDelay: `${burstIndex * 0.08}s`
              }}
            />
          ))}
        </div>
      ))}

      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={`confetti-${eventKey}-${index}`}
          className="fireworks-confetti"
          style={{
            left: `${4 + ((index * 17) % 92)}%`,
            backgroundColor: confettiColors[index % confettiColors.length],
            transform: `rotate(${index * 27}deg)`,
            animationDelay: `${(index % 7) * 0.06}s`
          }}
        />
      ))}

      <div className="fireworks-message">🎉 Chính xác! Bé giỏi quá! ✨</div>
    </div>
  );
}
