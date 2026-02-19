import React, { useState } from 'react';
import { signIn, confirmSignIn, fetchAuthSession, resetPassword, confirmResetPassword } from 'aws-amplify/auth'; // ✅ REQUIRED for deleteUser to work
import {
  Box,
  Typography,
  TextField,
  Button, // ✅ Add this
  CircularProgress,
  Alert
} from "@mui/material";
import axios from 'axios';
import { API_BASE, USE_AMPLIFY } from '../api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ CLEANUP: Remove accidental spaces from email
    const cleanEmail = email.trim();
    const cleanPassword = password; // Do not trim password as spaces can be part of it

    try {
      let jwt = null;

      if (USE_AMPLIFY) {
        // ✅ Official Amplify Sign-In
        const { isSignedIn, nextStep } = await signIn({
          username: cleanEmail,
          password: cleanPassword,
        });

        // ✅ Handle the Force Password Change requirement
        if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          const newPassword = prompt("A new password is required. Please enter a permanent password:");

          if (newPassword) {
            const result = await confirmSignIn({ challengeResponse: newPassword });
            if (result.isSignedIn) {
               // Proceed to fetch session as normal
               const session = await fetchAuthSession();
               jwt = session.tokens.accessToken.toString();
               localStorage.setItem('token', jwt);
               onLogin(jwt, cleanEmail);
               return;
            }
          } else {
            setError("You must change your password to continue.");
            setLoading(false);
            return;
          }
        }

        if (isSignedIn) {
          const session = await fetchAuthSession();
          jwt = session.tokens.accessToken.toString();
          localStorage.setItem('token', jwt);
          onLogin(jwt, cleanEmail);
        }
      } else {
        // Fallback for local dev
        const res = await axios.post(`${API_BASE}/auth/token`, {
          email: cleanEmail,
          password: cleanPassword
        });
        jwt = res.data.access_token;
        localStorage.setItem('token', jwt);
        onLogin(jwt, cleanEmail);
      }
    } catch (err) {
      console.error("Cognito Auth Error:", err);

      // ✅ User-Friendly Error Mapping
      if (err.name === 'NotAuthorizedException') {
        setError("Invalid email or password.");
      } else if (err.name === 'UserNotFoundException') {
        setError("Account not found.");
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

const handleForgotPassword = async () => {
    const emailToReset = prompt("Please enter your email:");
    if (!emailToReset) return;

    try {
      await resetPassword({ username: emailToReset.trim() });
      const code = prompt("Enter the 6-digit code sent to your email:");
      const newPass = prompt("Enter your new permanent password:");

      if (code && newPass) {
        await confirmResetPassword({
          username: emailToReset.trim(),
          confirmationCode: code,
          newPassword: newPass
        });
        alert("Password reset successfully! You can now log in.");
      }
    } catch (err) {
      alert("Reset failed: " + err.message);
    }
  };

  // Add this inside your return() after the Submit button:
  <Button onClick={handleForgotPassword} sx={{ mt: 1, textTransform: 'none' }}>
    Forgot Password?
  </Button>

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '400px', margin: '20px auto'}}>
      <h2>Login ({USE_AMPLIFY ? 'Amplify' : 'Local'})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
      <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
        {loading ? 'Authenticating...' : 'Login'}
      </button>
      {/* ✅ Forgot Password Button */}
      <Button
        fullWidth
        onClick={handleForgotPassword}
        sx={{ mt: 1, textTransform: 'none' }}
      >
        Forgot Password?
      </Button>
    </form>
  );
}

export default Login;