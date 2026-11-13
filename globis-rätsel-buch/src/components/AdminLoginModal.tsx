import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, KeyRound } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim();
    if (clean.toLowerCase() === 'anne') {
      soundEffects.playSuccess();
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      soundEffects.playError();
      setError(true);
    }
  };

  const handleClose = () => {
    soundEffects.playClick();
    setPassword('');
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-[#fffdf5] rounded-3xl comic-box p-6 shadow-[6px_6px_0px_#000] border-3 border-black">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer"
          title="Schliessen"
        >
          <X className="w-4 h-4 text-stone-800" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 border-3 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center mb-3">
            <KeyRound className="w-7 h-7 text-stone-900" />
          </div>
          <h2 className="text-2xl font-comic font-black tracking-wide text-stone-900">
            Adminbereich
          </h2>
          <p className="text-xs text-stone-600 font-comic mt-1">
            Geschützter Bereich für Spielleitung & Organisation.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-comic font-bold text-stone-700 mb-1.5">
              Passwort eingeben:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Passwort..."
                className={`w-full px-3.5 py-2.5 pr-10 text-base font-comic font-bold rounded-xl border-2 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 ${
                  error
                    ? 'border-red-600 focus:ring-red-400 ring-2 ring-red-200'
                    : 'border-black focus:ring-amber-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-900 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-600 font-comic font-bold flex items-center gap-1">
                <span>✕</span> Falsches Passwort! Bitte erneut versuchen.
              </p>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl border-2 border-black bg-stone-100 hover:bg-stone-200 font-comic font-bold text-sm text-stone-800 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl border-2 border-black bg-[#e23636] hover:bg-[#c92a2a] text-white font-comic font-bold text-sm shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Einloggen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
