'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  AlertCircle,
  Github,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { fadeInUp, staggerContainer } from '@/lib/animations';

// 登录方式类型
type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  // 登录方式切换
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  // 表单状态管理
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // 表单验证错误
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string }>({});

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (loginMethod === 'email') {
      if (!email) {
        newErrors.email = '请输入邮箱地址';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = '请输入有效的邮箱格式';
      }
    } else {
      if (!phone) {
        newErrors.phone = '请输入手机号码';
      } else if (!/^1[3-9]\d{9}$/.test(phone)) {
        newErrors.phone = '请输入有效的11位手机号';
      }
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 8) {
      newErrors.password = '密码长度至少8位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* Login Container - Desktop split / Mobile centered */}
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border border-[#EAECEF]"
        >
          {/* ==================== 左侧品牌区域 (Desktop) ==================== */}
          <motion.div
            variants={fadeInUp}
            className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.25) 0%, rgba(11, 15, 25, 1) 70%)',
            }}
          >
            {/* 背景装饰圆 */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-16 right-8 w-40 h-40 bg-samoa/15 rounded-full blur-3xl" />

            <div className="relative z-10 text-center space-y-6">
              {/* Logo & Brand Name */}
              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-wide">
                  <span className="text-brand-500">ZS</span>
                  <span className="text-text-primary"> EXCHANGE</span>
                </h2>
                <p className="text-text-secondary text-sm tracking-widest uppercase">
                  中萨数字科技交易所
                </p>
              </div>

              {/* Samoa License Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/50 bg-samoa/10">
                <span className="text-xl font-medium text-samoa">萨摩亚持牌</span>
              </div>

              {/* 品牌定位语 */}
              <div className="space-y-2 pt-4">
                <p className="text-text-primary text-lg font-medium leading-relaxed">
                  全球数字金融新枢纽
                </p>
                <p className="text-text-muted text-sm max-w-xs mx-auto">
                  萨摩亚政府持牌 · 100+交易对 · 银行级安全防护
                </p>
              </div>

              {/* 装饰性数据指标 */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-deep-700/50">
                <div className="text-center">
                  <p className="text-brand-500 text-xl font-bold">100+</p>
                  <p className="text-text-muted text-xs">交易对</p>
                </div>
                <div className="text-center">
                  <p className="text-samoa text-xl font-bold">50万+</p>
                  <p className="text-text-muted text-xs">全球用户</p>
                </div>
                <div className="text-center">
                  <p className="text-success text-xl font-bold">99.9%</p>
                  <p className="text-text-muted text-xs">系统稳定性</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== 右侧表单区域 ==================== */}
          <motion.div
            variants={fadeInUp}
            className="bg-deep-800 p-8 md:p-10 flex flex-col justify-center"
          >
            <div className="max-w-md mx-auto w-full space-y-7">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-primary">
                  登录您的账户
                </h1>
                <p className="text-text-secondary text-sm">
                  登录以继续使用交易服务
                </p>
              </div>

              {/* 登录方式切换 Tab */}
              <div className="flex bg-deep-900 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('email'); setErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    loginMethod === 'email'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Mail size={16} />
                  邮箱登录
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('phone'); setErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    loginMethod === 'phone'
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Phone size={16} />
                  手机号登录
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* 邮箱/手机号输入 (带错误提示) */}
                <AnimatePresence mode="wait">
                  {loginMethod === 'email' ? (
                    <motion.div
                      key="email-input"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        label="邮箱地址"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }}
                        leftIcon={<Mail size={18} />}
                        required
                        error={errors.email}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="phone-input"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-secondary">
                          手机号码
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 z-10 text-text-muted pointer-events-none">
                            <Phone size={18} />
                          </span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })); }}
                            placeholder="请输入11位手机号"
                            className={`
                              w-full rounded-lg bg-deep-700 border
                              text-text-primary placeholder:text-text-muted
                              transition-all duration-200 ease-out outline-none
                              focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                              pl-10 pr-4 py-2.5
                              ${errors.phone ? 'border-danger ring-1 ring-danger/50' : 'border-deep-700'}
                            `}
                          />
                        </div>
                        {errors.phone && (
                          <motion.p 
                            initial={{ opacity: 0, y: -5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-danger flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={12} />
                            {errors.phone}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 密码输入 (带显示/隐藏切换 + 错误提示) */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-text-secondary">
                    密码
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 z-10 text-text-muted pointer-events-none">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }}
                      placeholder="请输入密码（至少8位）"
                      required
                      minLength={8}
                      className={`
                        w-full rounded-lg bg-deep-700 border
                        text-text-primary placeholder:text-text-muted
                        transition-all duration-200 ease-out outline-none
                        focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                        pl-10 pr-11 py-2.5
                        ${errors.password ? 'border-danger ring-1 ring-danger/50' : 'border-deep-700'}
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 z-10 text-text-muted hover:text-text-secondary transition-colors"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-danger flex items-center gap-1 mt-1"
                    >
                      <AlertCircle size={12} />
                      {errors.password}
                    </motion.p>
                  )}
                </div>

                {/* 记住我 + 忘记密码链接 */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="
                        w-4 h-4 rounded border-[#EAECEF] bg-white
                        text-brand-500 focus:ring-brand-500/50
                        cursor-pointer accent-brand-500
                      "
                    />
                    <span className="text-sm text-text-secondary">记住我</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-light hover:text-brand-500 transition-colors no-underline"
                  >
                    忘记密码？
                  </Link>
                </div>

                {/* 登录按钮 - 全宽主CTA */}
                <Button
                  type="submit"
                  isLoading={isLoading}
                  size="lg"
                  disabled={isLoading}
                  className="w-full !rounded-lg bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm"
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </form>

              {/* 分隔线 */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-[#EAECEF]" />
                <span className="text-text-muted text-xs whitespace-nowrap">或</span>
                <div className="flex-1 h-px bg-[#EAECEF]" />
              </div>

              {/* 第三方登录按钮组 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google 登录 */}
                <button
                  type="button"
                  className="
                    flex items-center justify-center gap-2 py-2.5 px-4
                    rounded-lg border border-[#EAECEF] bg-white
                    text-text-secondary text-sm font-medium
                    hover:bg-[#F7F8FA] hover:border-[#D1D5DB] hover:text-text-primary
                    transition-all duration-200 cursor-pointer
                  "
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>

                {/* GitHub 登录 */}
                <button
                  type="button"
                  className="
                    flex items-center justify-center gap-2 py-2.5 px-4
                    rounded-lg border border-[#EAECEF] bg-white
                    text-text-secondary text-sm font-medium
                    hover:bg-[#F7F8FA] hover:border-[#D1D5DB] hover:text-text-primary
                    transition-all duration-200 cursor-pointer
                  "
                >
                  <Github size={20} className="fill-current" />
                  GitHub
                </button>
              </div>

              {/* 注册引导链接 */}
              <p className="text-center text-sm text-text-secondary">
                还没有账号？{' '}
                <Link
                  href="/register"
                  className="text-brand-500 hover:text-brand-light font-medium inline-flex items-center gap-1 transition-colors no-underline"
                >
                  立即注册
                  <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
