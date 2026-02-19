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

    try {
      let jwt = null;

      if (USE_AMPLIFY) {
        // ✅ CORRECT WAY: Use Amplify Auth to sign in
        // This populates the internal library state for deleteUser()
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password: password,
        });

        if (isSignedIn) {
          // Now that Amplify is logged in, we grab the token for your Lambda logic
          const session = await fetchAuthSession();
          jwt = session.tokens.accessToken.toString();
          localStorage.setItem('token', jwt);
        }
      } else {
        const res = await axios.post(`${API_BASE}/auth/token`, { email, password });
        jwt = res.data.access_token;
        localStorage.setItem('token', jwt);
        console.log("Token saved to local storage!");
      }

      if (jwt) onLogin(jwt, email);
      else setError('Login failed: Invalid credentials');
    } catch (err) {
      console.error("Auth Error:", err);
      // Handle Cognito specific errors (like UserNotFoundException)
      setError(err.message || 'Server error occurred');
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