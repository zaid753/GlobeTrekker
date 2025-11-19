import React, { useState } from 'react';
import { UserIcon, LockIcon, ArrowRightIcon, ArrowLeftIcon, GoogleIcon, CheckCircleIcon } from './icons';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword } from '../services/firebase';

interface AuthPageProps {
  onBack: () => void;
  canGoBack: boolean;
  initialView?: 'login' | 'signup';
}

const AuthPage: React.FC<AuthPageProps> = ({ onBack, canGoBack, initialView }) => {
  const [isLoginView, setIsLoginView] = useState(initialView !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
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
      // Auth success is handled by the onAuthStateChanged listener in App.tsx.
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "Failed to sign in with Google. Please ensure popups are not blocked and try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = "Sign-in window was closed. Please try again.";
      } else if (error.code === 'auth/unauthorized-domain') {
          const currentDomain = window.location.hostname;
          errorMessage = `DOMAIN ERROR: The domain "${currentDomain}" is not authorized for Google Sign-In. Please use "Sign Up" with Email/Password instead.`;
      } else if (error.code === 'auth/popup-blocked') {
          errorMessage = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
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

    // Basic email check before calling API
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
        console.error("Reset Password Error:", error);
        let errorMessage = "Failed to send reset email. Please try again.";
        if (error.code === 'auth/user-not-found') {
             errorMessage = "No account found with this email address.";
        } else if (error.code === 'auth/invalid-email') {
             errorMessage = "Invalid email address.";
        }
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
      // Success is handled by onAuthStateChanged in App.tsx, which will navigate away.
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
          errorMessage = "Invalid email or password. If you've forgotten your password, reset it below.";
          break;
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please use at least 6 characters.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later or reset your password.";
          break;
        default:
          console.error("Firebase Auth Error:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 pt-20 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl dark:border dark:border-gray-700 p-8 space-y-6 relative">
        {canGoBack && (
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeftIcon className="h-7 w-7" />
            </button>
        )}
        <div>
          <h2 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-100">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">
            {isLoginView ? 'Log in to access your saved trips.' : 'Sign up to start planning your dream trips.'}
          </p>
        </div>
        
        <div className="space-y-4">
            <button 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm hover:shadow-md hover:-translate-y-px transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGoogleLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <GoogleIcon className="h-5 w-5" />
                )}
                Continue with Google
            </button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">OR</span></div>
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
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
              disabled={isLoading || isGoogleLoading}
            />
             {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1 ml-2">{errors.email}</p>}
          </div>
          <div className="relative">
            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className={`${inputStyles} ${errors.password ? errorInputStyles : normalInputStyles}`}
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
              disabled={isLoading || isGoogleLoading}
            />
            {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
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
                aria-invalid={!!errors.confirmPassword}
                aria-describedby="confirm-password-error"
                disabled={isLoading || isGoogleLoading}
                />
                {errors.confirmPassword && <p id="confirm-password-error" className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
            </div>
          )}
          {isLoginView && (
            <div className="text-right">
                <button
                    onClick={handleForgotPassword}
                    className="text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500 focus:outline-none focus-visible:underline"
                    disabled={isLoading || isGoogleLoading}
                    type="button"
                >
                    Forgot Password?
                </button>
            </div>
          )}
          {resetSent && (
            <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-3 rounded text-sm flex items-start gap-2 animate-pulse" role="alert">
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>Password reset email sent! Check your inbox.</p>
            </div>
          )}
          {errors.form && (
            <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 rounded text-sm break-words whitespace-pre-wrap" role="alert">
                <p>{errors.form}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all duration-300 ease-in-out active:scale-95 active:shadow-sm active:translate-y-0 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-700 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isLoginView ? 'Login' : 'Create Account'}
            {!isLoading && <ArrowRightIcon className="h-5 w-5 ml-2" />}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
                setIsLoginView(!isLoginView);
                setErrors({});
                setResetSent(false);
            }}
            className="font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-500 focus:outline-none focus-visible:underline"
          >
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;