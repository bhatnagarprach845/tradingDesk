import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api'; // Use /api or /data
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
        // Create the client ONLY when the button is clicked
        const client = generateClient();

        const response = await client.queries.login({ email, password });
        jwt = response.data?.login;
      } else {
        const res = await axios.post(`${API_BASE}/auth/token`, { email, password });
        jwt = res.data.access_token;
      }

      if (jwt) {
        onLogin(jwt);
      } else {
        setError('No token returned from server.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login ({USE_AMPLIFY ? 'Amplify' : 'Local'})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
    </form>
  );
}

export default Login;