
import React, { useState, useEffect } from 'react';
import { UserIcon, LockIcon, ArrowRightIcon, GoogleIcon, CheckCircleIcon, CloseIcon, ArrowLeftIcon } from './icons';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
  const [isLoginView, setIsLoginView] = useState(initialView !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  // Sync state when prop changes or modal re-opens
  useEffect(() => {
    if (isOpen) {
        setIsLoginView(initialView !== 'signup');
        setErrors({});
        setResetSent(false);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
        newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (!isLoginView) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "Failed to sign in with Google.";
      
      if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Sign-in window was closed.";
      } else if (error.code === 'auth/popup-blocked') {
          errorMessage = "Popup blocked. Please allow popups.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      setErrors({ form: errorMessage });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setErrors({});
    setResetSent(false);

    if (!email) {
        setErrors({ email: "Please enter your email address above to reset your password." });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setErrors({ email: "Please enter a valid email address." });
        return;
    }

    setIsLoading(true);

    try {
        await resetPassword(email);
        setResetSent(true);
        setErrors({}); 
    } catch (error: any) {
        let errorMessage = "Failed to send reset email.";
        if (error.code === 'auth/user-not-found') errorMessage = "No account found with this email.";
        setErrors({ form: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsLoading(true);
    setErrors({});

    try {
      if (isLoginView) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onClose();
    } catch (error: any) {
      let errorMessage = "An error occurred.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "Email already in use.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password too weak.";
          break;
        default:
          if (error.message) errorMessage = error.message;
          break;
      }
      setErrors({ form: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputStyles = "form-input w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-all bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400";
  const errorInputStyles = "border-red-500 ring-2 ring-red-500/50 bg-red-50 dark:bg-red-900/20";
  const normalInputStyles = "border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 dark:focus:ring-cyan-400/50 dark:focus:border-cyan-400";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-8 space-y-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 z-10">
            <CloseIcon className="h-6 w-6" />
        </button>
        
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
            {isLoginView ? 'Welcome Back' : 'Join GlobeTrekker'}
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {isLoginView ? 'Log in to sync your trips.' : 'Create an account to start planning.'}
          </p>
        </div>
        
        <div className="space-y-4">
            <button 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-all"
            >
                {isGoogleLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <GoogleIcon className="h-5 w-5" />
                )}
                Continue with Google
            </button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 uppercase">Or with email</span></div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className={`${inputStyles} ${errors.email ? errorInputStyles : normalInputStyles}`}
            />
             {errors.email && <p className="text-red-500 text-xs mt-1 ml-2">{errors.email}</p>}
          </div>
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={`${inputStyles} ${errors.password ? errorInputStyles : normalInputStyles}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
          </div>
          {!isLoginView && (
            <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={`${inputStyles} ${errors.confirmPassword ? errorInputStyles : normalInputStyles}`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
            </div>
          )}
          {isLoginView && (
            <div className="text-right">
                <button onClick={handleForgotPassword} type="button" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500">Forgot Password?</button>
            </div>
          )}
          {resetSent && (
            <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-3 rounded text-sm flex items-start gap-2">
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                <p>Reset email sent!</p>
            </div>
          )}
          {errors.form && (
            <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 rounded text-sm">
                <p>{errors.form}</p>
            </div>
          )}
          <button type="submit" disabled={isLoading || isGoogleLoading} className="w-full py-3 px-4 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-md transition-all flex items-center justify-center disabled:opacity-50">
            {isLoading ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isLoginView ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button type="button" onClick={() => { setIsLoginView(!isLoginView); setErrors({}); }} className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500 underline">
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
