import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Github, Facebook, Linkedin, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get('redirect') || '/student/upload';

  const [isActive, setIsActive] = useState(location.pathname === '/register');

  // --- Sign In state ---
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // --- Sign Up state ---
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInLoading(true);
    setSignInError('');
    try {
      const userInfo = await login({ email: signInEmail, password: signInPassword });
      // Role-based routing
      if (userInfo.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectPath);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || '';
      setSignInError(msg || 'Login failed. Please check your credentials.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    setSignUpError('');
    setSignUpSuccess('');
    try {
      await register({ name: signUpName, email: signUpEmail, password: signUpPassword, role: 'STUDENT' });
      setSignUpSuccess('Account created! Please sign in.');
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPassword('');
      // Switch to sign-in after short delay
      setTimeout(() => setIsActive(false), 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data || '';
      setSignUpError(msg || 'Registration failed. Please try again.');
    } finally {
      setSignUpLoading(false);
    }
  };

  const switchToSignIn = () => {
    setIsActive(false);
    setSignInError('');
    setSignUpError('');
    setSignUpSuccess('');
  };

  const switchToSignUp = () => {
    setIsActive(true);
    setSignInError('');
    setSignUpError('');
    setSignUpSuccess('');
  };

  return (
    <div className="login-page-root">
      <div className={`login-container ${isActive ? 'active' : ''}`} id="login-container">

        {/* ── Sign Up Form ── */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <div className="social-icons">
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Facebook size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} /></a>
              <a href="#" className="icon"><Mail size={20} /></a>
            </div>
            <span>or use your email for registration</span>

            <input
              type="text"
              id="signup-name"
              placeholder="Full Name"
              autoComplete="off"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              required
            />
            <input
              type="email"
              id="signup-email"
              placeholder="Email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />
            <div className="input-pw-wrapper">
              <input
                type={showSignUpPw ? 'text' : 'password'}
                id="signup-password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowSignUpPw(!showSignUpPw)}
                tabIndex={-1}
              >
                {showSignUpPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {signUpError && (
              <div className="form-error">{signUpError}</div>
            )}
            {signUpSuccess && (
              <div className="form-success">{signUpSuccess}</div>
            )}

            <button type="submit" disabled={signUpLoading}>
              {signUpLoading ? <Loader2 className="spin-icon" size={16} /> : null}
              Sign Up
            </button>
          </form>
        </div>

        {/* ── Sign In Form ── */}
        <div className="form-container sign-in">
          <form onSubmit={handleSignIn}>
            <h1>Sign In</h1>
            <div className="social-icons">
              <a href="#" className="icon"><Github size={20} /></a>
              <a href="#" className="icon"><Facebook size={20} /></a>
              <a href="#" className="icon"><Linkedin size={20} /></a>
              <a href="#" className="icon"><Mail size={20} /></a>
            </div>
            <span>or use your email &amp; password</span>

            <input
              type="email"
              id="signin-email"
              placeholder="Email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <div className="input-pw-wrapper">
              <input
                type={showSignInPw ? 'text' : 'password'}
                id="signin-password"
                placeholder="Password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowSignInPw(!showSignInPw)}
                tabIndex={-1}
              >
                {showSignInPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {signInError && (
              <div className="form-error">{signInError}</div>
            )}

            <a href="#" className="forgot-link">Forgot your password?</a>

            <button type="submit" disabled={signInLoading}>
              {signInLoading ? <Loader2 className="spin-icon" size={16} /> : null}
              Sign In
            </button>
          </form>
        </div>

        {/* ── Toggle Panel ── */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Sign in to continue to CodeGuardian</p>
              <button className="ghost-button" id="login" onClick={switchToSignIn}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your details to join CodeGuardian</p>
              <button className="ghost-button" id="register" onClick={switchToSignUp}>
                Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
