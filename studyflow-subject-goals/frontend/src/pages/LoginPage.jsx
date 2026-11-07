import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      showToast('Welcome back! Logged in successfully.', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setValue('email', 'alex@studyflow.ai');
    setValue('password', 'Password123!');
    showToast('Demo credentials loaded (Alex Morgan)', 'info');
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your credentials to access your subjects and study goals
        </p>
      </div>

      {/* Demo Credentials Quick Button */}
      <div className="mb-6 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
        <p className="text-xs text-indigo-300 font-semibold mb-2">
          Want a quick walkthrough?
        </p>
        <button
          type="button"
          onClick={handleFillDemo}
          className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>1-Click Fill Demo (Alex Morgan)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              {...register('email')}
              placeholder="you@domain.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border ${
                errors.email ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-500`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <span className="text-[11px] text-slate-400 cursor-pointer hover:text-indigo-400 transition-colors">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border ${
                errors.password ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-500`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800"
          />
          <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-300 select-none">
            Remember this device for 7 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          <span>{loading ? 'Authenticating...' : 'Sign In to StudyFlow'}</span>
        </button>
      </form>

      {/* Footer link to Signup */}
      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Don't have an account? </span>
        <Link
          to="/signup"
          className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
