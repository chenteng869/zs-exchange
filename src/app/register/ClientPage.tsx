'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Globe,
  Gift,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  Send,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { fadeInUp, staggerContainer } from '@/lib/animations';

// ==================== 步骤配置 ====================
const STEPS = [
  { id: 1, label: '邮箱验证', icon: <Mail size={16} /> },
  { id: 2, label: '设置密码', icon: <Lock size={16} /> },
  { id: 3, label: '身份信息', icon: <Shield size={16} /> },
];

// 国家/地区选项列表
const countryOptions = [
  { value: 'CN', label: '🇨🇳 中国大陆' },
  { value: 'HK', label: '🇭🇰 中国香港' },
  { value: 'TW', label: '🇹🇼 中国台湾' },
  { value: 'US', label: '🇺🇸 美国' },
  { value: 'SG', label: '🇸🇬 新加坡' },
  { value: 'JP', label: '🇯🇵 日本' },
  { value: 'KR', label: '🇰🇷 韩国' },
  { value: 'GB', label: '🇬🇧 英国' },
  { value: 'DE', label: '🇩🇪 德国' },
  { value: 'AU', label: '🇦🇺 澳大利亚' },
  { value: 'CA', label: '🇨🇦 加拿大' },
  { value: 'FR', label: '🇫🇷 法国' },
  { value: 'OTHER', label: '其他地区' },
];

export default function RegisterPage() {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1：邮箱验证
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  
  // 步骤2：密码设置
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 步骤3：身份信息(KYC)
  const [country, setCountry] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [realName, setRealName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // 其他状态
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 密码强度计算 (0-4)
  const getPasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strengthLabels = ['', '弱', '一般', '较强', '强'];
  const strengthColors = ['', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];

  const passwordStrength = getPasswordStrength(password);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }));
      return;
    }
    
    setIsLoading(true);
    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsCodeSent(true);
    setCountdown(60);
    setIsLoading(false);
    setErrors(prev => ({ ...prev, email: undefined }));
  }, [email]);

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!email) newErrors.email = '请输入邮箱地址';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = '邮箱格式不正确';
      if (!isCodeSent || !verificationCode) newErrors.code = '请输入验证码';
      else if (verificationCode.length !== 6) newErrors.code = '验证码为6位数字';
    }
    
    if (currentStep === 2) {
      if (!password) newErrors.password = '请设置密码';
      else if (password.length < 8) newErrors.password = '密码至少8位';
      if (!confirmPassword) newErrors.confirmPassword = '请确认密码';
      else if (password !== confirmPassword) newErrors.confirmPassword = '两次密码不一致';
    }
    
    if (currentStep === 3) {
      if (!realName) newErrors.realName = '请输入真实姓名';
      if (!country) newErrors.country = '请选择国家/地区';
      if (!idNumber) newErrors.idNumber = '请输入身份证号';
      if (!agreedToTerms) newErrors.terms = '请同意服务条款';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下一步
  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  // 最终提交
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    alert('注册成功！欢迎加入 ZS Exchange');
  };

  // 步骤过渡动画变体
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* Register Container - Desktop split / Mobile centered */}
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
            <div className="absolute top-10 right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-16 left-8 w-40 h-40 bg-success/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-wide">
                  <span className="text-brand-500">ZS</span>
                  <span className="text-text-primary"> EXCHANGE</span>
                </h2>
                <p className="text-text-secondary text-sm tracking-widest uppercase">
                  中萨数字科技交易所
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/50 bg-samoa/10">
                <span className="text-sm font-medium text-samoa">萨摩亚持牌</span>
              </div>

              {/* 注册优势列表 */}
              <div className="space-y-3 pt-4 text-left max-w-sm mx-auto">
                <p className="text-text-primary font-medium mb-3">注册即享：</p>
                {[
                  '全球100+主流数字资产交易对',
                  '银行级安全防护，资产冷存储保障',
                  '7×24小时多语言专业客服支持',
                  '新人专属注册礼包与费率优惠',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                    <span className="text-text-secondary text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-deep-700/50">
                <div className="text-center">
                  <p className="text-brand-500 text-xl font-bold">$50亿+</p>
                  <p className="text-text-muted text-xs">累计交易额</p>
                </div>
                <div className="text-center">
                  <p className="text-samoa text-xl font-bold">180+</p>
                  <p className="text-text-muted text-xs">服务国家</p>
                </div>
                <div className="text-center">
                  <p className="text-success text-xl font-bold">&lt;0.1s</p>
                  <p className="text-text-muted text-xs">订单撮合</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ==================== 右侧表单区域 ==================== */}
          <motion.div
            variants={fadeInUp}
            className="bg-white p-8 md:p-10 flex flex-col justify-center"
          >
            <div className="max-w-md mx-auto w-full space-y-5">
              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-primary">
                  创建账户
                </h1>
                <p className="text-text-secondary text-sm">
                  创建您的 ZS Exchange 账户
                </p>
              </div>

              {/* ==================== 步骤条 ==================== */}
              <div className="flex items-center justify-between mb-6 px-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                          currentStep > step.id
                            ? 'bg-success text-white'
                            : currentStep === step.id
                            ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                            : 'bg-[#F7F8FA] text-text-muted'
                        }`}
                      >
                        {currentStep > step.id ? <CheckCircle2 size={18} /> : step.icon}
                      </div>
                      <span
                        className={`text-xs mt-1.5 transition-colors ${
                          currentStep >= step.id ? 'text-text-primary font-medium' : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 mt-[-20px] transition-colors duration-300 ${
                          currentStep > step.id ? 'bg-success' : 'bg-deep-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ==================== 表单内容区域 (带步骤动画) ==================== */}
              <div className="relative min-h-[320px]">
                <AnimatePresence mode="wait" custom={1}>
                  {/* ====== 步骤1: 邮箱验证 ====== */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step-1"
                      custom={1}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-4 absolute inset-0"
                    >
                      <Input
                        label="邮箱地址 *"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                        leftIcon={<Mail size={18} />}
                        error={errors.email}
                      />

                      {/* 验证码输入 */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-secondary">
                          邮箱验证码 *
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, code: undefined })); }}
                            placeholder="请输入6位验证码"
                            className={`flex-1 rounded-lg border px-4 py-2.5 text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all bg-white ${errors.code ? 'border-danger' : 'border-[#EAECEF]'}`}
                          />
                          <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={countdown > 0 || isLoading}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                              countdown > 0
                                ? 'bg-deep-700 text-text-muted cursor-not-allowed'
                                : 'bg-brand-500/20 text-brand-light hover:bg-brand-500/30'
                            }`}
                          >
                            {countdown > 0 ? `${countdown}s` : isLoading ? '发送中...' : '发送验证码'}
                          </button>
                        </div>
                        {errors.code && (
                          <p className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.code}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full !rounded-lg bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm"
                        rightIcon={<ArrowRight size={16} />}
                      >
                        下一步
                      </Button>
                    </motion.div>
                  )}

                  {/* ====== 步骤2: 设置密码 ====== */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step-2"
                      custom={1}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-4 absolute inset-0"
                    >
                      {/* 密码输入 */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-secondary">
                          设置密码 *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 z-10 text-text-muted pointer-events-none">
                            <Lock size={18} />
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                            placeholder="至少8位，包含字母和数字"
                            required
                            minLength={8}
                            className={`w-full rounded-lg bg-deep-700 border text-text-primary placeholder:text-text-muted transition-all outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 pl-10 pr-11 py-2.5 ${errors.password ? 'border-danger' : 'border-deep-700'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 z-10 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.password}
                          </p>
                        )}

                        {/* Password Strength Indicator */}
                        {password && (
                          <div className="space-y-1.5 mt-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                    level <= passwordStrength
                                      ? strengthColors[passwordStrength]
                                      : 'bg-[#EAECEF]'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-xs ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                              密码强度：{strengthLabels[passwordStrength]}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 确认密码 */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-secondary">
                          确认密码 *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 z-10 text-text-muted pointer-events-none">
                            <Lock size={18} />
                          </span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                            placeholder="请再次输入密码"
                            required
                            className={`w-full rounded-lg bg-white border text-text-primary placeholder:text-text-muted transition-all outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 pl-10 pr-11 py-2.5 ${errors.confirmPassword ? 'border-danger' : 'border-[#EAECEF]'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 z-10 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      {/* 上一步 / 下一步 按钮 */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          size="lg"
                          className="!rounded-lg flex-1"
                          leftIcon={<ArrowLeft size={16} />}
                        >
                          上一步
                        </Button>
                        <Button
                          onClick={handleNext}
                          size="lg"
                          className="!rounded-lg flex-1 bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm"
                          rightIcon={<ArrowRight size={16} />}
                        >
                          下一步
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* ====== 步骤3: 身份信息(KYC) ====== */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step-3"
                      custom={1}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25 }}
                      className="space-y-4 absolute inset-0"
                    >
                      {/* 真实姓名 */}
                      <Input
                        label="真实姓名 *"
                        type="text"
                        placeholder="请输入与证件一致的真实姓名"
                        value={realName}
                        onChange={(e) => { setRealName(e.target.value); setErrors(prev => ({ ...prev, realName: undefined })); }}
                        leftIcon={<User size={18} />}
                        error={errors.realName}
                      />

                      {/* 国家/地区选择 */}
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="text-sm font-medium text-text-secondary">
                          国家/地区 *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 z-10 text-text-muted pointer-events-none">
                            <Globe size={18} />
                          </span>
                          <select
                            value={country}
                            onChange={(e) => { setCountry(e.target.value); setErrors(prev => ({ ...prev, country: undefined })); }}
                            className={`w-full rounded-lg bg-white border text-text-primary appearance-none transition-all outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 pl-10 pr-10 py-2.5 cursor-pointer ${errors.country ? 'border-danger' : 'border-[#EAECEF]'}`}
                          >
                            <option value="" disabled>请选择国家或地区</option>
                            {countryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-3 z-10 text-text-muted pointer-events-none">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L2 4h8L6 8z" /></svg>
                          </span>
                        </div>
                        {errors.country && (
                          <p className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.country}
                          </p>
                        )}
                      </div>

                      {/* 身份证号 */}
                      <Input
                        label="身份证号/护照号 *"
                        type="text"
                        placeholder="请输入您的证件号码"
                        value={idNumber}
                        onChange={(e) => { setIdNumber(e.target.value); setErrors(prev => ({ ...prev, idNumber: undefined })); }}
                        leftIcon={<Shield size={18} />}
                        error={errors.idNumber}
                      />

                      {/* 服务条款 Checkbox */}
                      <div className="flex items-start gap-3 pt-1">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreedToTerms}
                          onChange={(e) => { setAgreedToTerms(e.target.checked); setErrors(prev => ({ ...prev, terms: undefined })); }}
                          className="mt-1 w-4 h-4 rounded border-[#EAECEF] bg-white text-brand-500 focus:ring-brand-500/50 cursor-pointer accent-brand-500"
                        />
                        <label htmlFor="terms" className="text-xs text-text-secondary leading-relaxed cursor-pointer">
                          我已阅读并同意{' '}
                          <Link href="/terms" className="text-brand-light hover:text-brand-500 transition-colors no-underline">
                            《用户协议》
                          </Link>{' '}
                          和{' '}
                          <Link href="/privacy" className="text-brand-light hover:text-brand-500 transition-colors no-underline">
                            《隐私政策》
                          </Link>{' '}
                          以及{' '}
                          <Link href="/kyc-policy" className="text-brand-light hover:text-brand-500 transition-colors no-underline">
                            《KYC认证条款》
                          </Link>
                        </label>
                      </div>
                      {errors.terms && (
                        <p className="text-xs text-danger flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.terms}
                        </p>
                      )}

                      {/* 上一步 / 提交按钮 */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          size="lg"
                          className="!rounded-lg flex-1"
                          leftIcon={<ArrowLeft size={16} />}
                        >
                          上一步
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          isLoading={isLoading}
                          size="lg"
                          className="!rounded-lg flex-1 bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm"
                          rightIcon={isLoading ? undefined : <CheckCircle2 size={16} />}
                        >
                          {isLoading ? '提交中...' : '完成注册'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 分隔线 */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-[#EAECEF]" />
                <span className="text-text-muted text-xs whitespace-nowrap">或</span>
                <div className="flex-1 h-px bg-[#EAECEF]" />
              </div>

              {/* 第三方注册按钮组 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#EAECEF] bg-white text-text-secondary text-sm font-medium hover:bg-[#F7F8FA] hover:border-[#D1D5DB] hover:text-text-primary transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>

              {/* 登录引导链接 */}
              <p className="text-center text-sm text-text-secondary">
                已有账号？{' '}
                <Link
                  href="/login"
                  className="text-brand-500 hover:text-brand-light font-medium inline-flex items-center gap-1 transition-colors no-underline"
                >
                  立即登录
                  <ArrowLeft size={14} />
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

// AlertCircle 组件（用于错误提示）
function AlertCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 12} height={props.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
}
