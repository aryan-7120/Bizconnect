import { X } from 'lucide-react';
import { useEffect } from 'react';
import clsx from 'clsx';

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-screen-xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={clsx(
        'relative w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl animate-slide-up overflow-hidden',
        sizes[size] || sizes.md,
        className
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[85vh] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
