import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
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
        const client = generateClient();
        const loginGql = `query Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }`;
        const res = await client.graphql({
          query: loginGql,
          variables: { email, password }
        });
        jwt = res.data.login;
      } else {
        const res = await axios.post(`${API_BASE}/auth/token`, { email, password });
        jwt = res.data.access_token;
        localStorage.setItem('token', jwt);
        console.log("Token saved to local storage!");
      }

      if (jwt) onLogin(jwt);
      else setError('Login failed: Invalid credentials');
    } catch (err) {
      console.error("Auth Error:", err);
      setError(err.response?.data?.detail || 'Server error occurred');
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