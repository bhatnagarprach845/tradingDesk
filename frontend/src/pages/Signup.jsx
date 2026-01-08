import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import axios from 'axios';
import { API_BASE, USE_AMPLIFY } from '../api';

function Signup({ onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (USE_AMPLIFY) {
        const client = generateClient();
        await client.mutations.signup({ email, password });
      } else {
        await axios.post(`${API_BASE}/auth/signup`, { email, password });
      }
      alert('Signup successful!');
      onSignup();
    } catch (err) {
      console.error(err);
      setError('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Signup ({USE_AMPLIFY ? 'Amplify' : 'Local'})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
      <button type="submit" disabled={loading}>Signup</button>
    </form>
  );
}

export default Signup;