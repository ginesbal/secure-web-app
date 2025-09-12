// FILE: client/src/pages/RegisterPage.jsx
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/security';

function RegisterPage({ addAlert }) {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        captchaAnswer: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Live validity
    const live = {
        username: {
            dirty: !!formData.username,
            valid: formData.username.length >= 3
        },
        email: {
            dirty: !!formData.email,
            valid: validateEmail(formData.email)
        },
        password: (() => {
            const v = validatePassword(formData.password);
            return { dirty: !!formData.password, valid: v.isValid, strength: v.strength ?? passwordStrength };
        })(),
        confirm: {
            dirty: !!formData.confirmPassword,
            valid: formData.password.length > 0 && formData.password === formData.confirmPassword
        },
        captcha: {
            dirty: !!formData.captchaAnswer,
            valid: formData.captchaAnswer === '10'
        }
    };

    const passwordsMatch = useMemo(
        () => live.confirm.valid,
        [formData.password, formData.confirmPassword]
    );

    const handlePasswordChange = (password) => {
        setFormData((prev) => ({ ...prev, password }));
        const validation = validatePassword(password);
        setPasswordStrength(validation.strength);
        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password =
                'Password must be at least 8 characters with uppercase, lowercase, and numbers';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (formData.captchaAnswer !== '10') {
            newErrors.captcha = 'Incorrect CAPTCHA answer';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        const result = await register(formData);

        if (result.success) {
            addAlert?.('Registration successful! Please login.', 'success');
            navigate('/login');
        } else {
            setErrors({ general: result.message });
            addAlert?.(result.message || 'Registration failed', 'error');
        }
        setLoading(false);
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength <= 2) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

    // unified input token + state rings
    const validRing = 'ring-1 ring-green-300 border-green-300 focus:ring-green-400 focus:border-green-400';
    const errorRing = 'ring-1 ring-red-300 border-red-300 focus:ring-red-400 focus:border-red-400';
    const inputClass = (hasError, isValid, extra = '') =>
        `input-field ${extra} ${hasError ? errorRing : isValid ? validRing : ''}`;

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md animate-fade-in">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14a7 7 0 00-7 7h7m0-7a7 7 0 017 7M15 7h6m-3-3v6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Register for a new account</p>
                </div>

                {/* Card */}
                <div className="card">
                    <div className="p-8">
                        {errors.general && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => {
                                        setFormData({ ...formData, username: e.target.value });
                                        if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                                    }}
                                    className={inputClass(!!errors.username, live.username.dirty && live.username.valid)}
                                    placeholder="Choose a username"
                                    disabled={loading}
                                    aria-invalid={!!errors.username}
                                    aria-describedby={errors.username ? 'username-error' : live.username.valid ? 'username-ok' : undefined}
                                />
                                {live.username.dirty && live.username.valid && !errors.username && (
                                    <ValidHint id="username-ok">Looks good</ValidHint>
                                )}
                                {errors.username && <ErrorText id="username-error">{errors.username}</ErrorText>}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    className={inputClass(!!errors.email, live.email.dirty && live.email.valid)}
                                    placeholder="your@email.com"
                                    disabled={loading}
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? 'email-error' : live.email.valid ? 'email-ok' : 'email-hint'}
                                />
                                {!errors.email && !live.email.valid && (
                                    <p id="email-hint" className="mt-1 text-xs text-gray-500">We’ll only use this for account access.</p>
                                )}
                                {live.email.dirty && live.email.valid && !errors.email && (
                                    <ValidHint id="email-ok">Looks good</ValidHint>
                                )}
                                {errors.email && <ErrorText id="email-error">{errors.email}</ErrorText>}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        className={inputClass(!!errors.password, live.password.dirty && live.password.valid, 'pr-10')}
                                        placeholder="Create a strong password"
                                        disabled={loading}
                                        aria-invalid={!!errors.password}
                                        aria-describedby={errors.password || formData.password ? 'password-help' : live.password.valid ? 'password-ok' : undefined}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Strength meter for password */}
                                {formData.password && (
                                    <div id="password-help" className="mt-2" aria-live="polite">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded ${i < passwordStrength ? getPasswordStrengthColor() : 'bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <p
                                            className={`text-xs mt-1 ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'
                                                }`}
                                        >
                                            Password strength: {getPasswordStrengthText()}
                                        </p>
                                    </div>
                                )}
                                {live.password.dirty && live.password.valid && !errors.password && (
                                    <ValidHint id="password-ok">Meets requirements</ValidHint>
                                )}
                                {errors.password && <ErrorText id="password-error">{errors.password}</ErrorText>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData({ ...formData, confirmPassword: e.target.value });
                                            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                                        }}
                                        className={inputClass(
                                            !!errors.confirmPassword,
                                            live.confirm.dirty && live.confirm.valid,
                                            'pr-10'
                                        )}
                                        placeholder="Re-enter password"
                                        disabled={loading}
                                        aria-invalid={!!errors.confirmPassword}
                                        aria-describedby={errors.confirmPassword ? 'confirm-error' : live.confirm.valid ? 'confirm-ok' : 'confirm-hint'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirm ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {!errors.confirmPassword && formData.confirmPassword && !live.confirm.valid && (
                                    <p id="confirm-hint" className="mt-1 text-xs text-gray-500">Must match the password</p>
                                )}
                                {live.confirm.dirty && live.confirm.valid && !errors.confirmPassword && (
                                    <ValidHint id="confirm-ok">Passwords match</ValidHint>
                                )}
                                {errors.confirmPassword && <ErrorText id="confirm-error">{errors.confirmPassword}</ErrorText>}
                            </div>

                            {/* CAPTCHA */}
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-2">
                                    CAPTCHA Demo
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 font-mono text-base text-gray-700 select-none">
                                        7 + 3 = ?
                                    </div>
                                    <input
                                        id="captcha"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        required
                                        value={formData.captchaAnswer}
                                        onChange={(e) => {
                                            setFormData({ ...formData, captchaAnswer: e.target.value });
                                            if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: undefined }));
                                        }}
                                        className={inputClass(!!errors.captcha, live.captcha.dirty && live.captcha.valid, 'w-28 text-center')}
                                        placeholder="Answer"
                                        disabled={loading}
                                        aria-invalid={!!errors.captcha}
                                        aria-describedby={errors.captcha ? 'captcha-error' : live.captcha.valid ? 'captcha-ok' : undefined}
                                    />
                                </div>
                                {live.captcha.dirty && live.captcha.valid && !errors.captcha && (
                                    <ValidHint id="captcha-ok" className="mt-2">Correct</ValidHint>
                                )}
                                {errors.captcha && <ErrorText id="captcha-error">{errors.captcha}</ErrorText>}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary justify-center"
                                aria-busy={loading}
                            >
                                {loading ? 'Creating account…' : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Helper panel */}
                <div className="mt-6 p-6 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-600 text-center">
                        Use a unique password. You’ll confirm your email after signing in.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ——— Small helpers for consistency ———
function ValidHint({ id, className = '', children }) {
    return (
        <p id={id} className={`mt-1 text-xs text-green-600 flex items-center gap-1 ${className}`} aria-live="polite">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
            </svg>
            {children}
        </p>
    );
}

function ErrorText({ id, children }) {
    return (
        <p id={id} className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
            {children}
        </p>
    );
}

export default RegisterPage;
