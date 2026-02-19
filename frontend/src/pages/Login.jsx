import React, { useState } from 'react';
import { signIn } from 'aws-amplify/auth'; // ✅ REQUIRED for deleteUser to work
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

    // ✅ Clean the inputs to prevent hidden space errors
    const cleanEmail = email.trim();
    const cleanPassword = password; // Passwords shouldn't be trimmed as spaces might be intentional

    try {
      let jwt = null;

      if (USE_AMPLIFY) {
        // ✅ STEP 1: Official Amplify Sign In
        const { isSignedIn, nextStep } = await signIn({
          username: cleanEmail,
          password: cleanPassword,
        });

        // Handle cases where user might need to confirm email or change password
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
           setError("Please confirm your email before logging in.");
           return;
        }

        if (isSignedIn) {
          // ✅ STEP 2: Retrieve session and token
          const session = await fetchAuthSession();
          jwt = session.tokens.accessToken.toString();
          localStorage.setItem('token', jwt);
          onLogin(jwt, cleanEmail);
        }
      } else {
        // Local Backend Fallback
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

      // ✅ Friendly Error Mapping
      if (err.name === 'NotAuthorizedException') {
        setError("Invalid email or password. Please try again.");
      } else if (err.name === 'UserNotFoundException') {
        setError("No account found with this email.");
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '400px', margin: '20px auto'}}>
      <h2>Login ({USE_AMPLIFY ? 'Amplify' : 'Local'})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
      <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
        {loading ? 'Authenticating...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;