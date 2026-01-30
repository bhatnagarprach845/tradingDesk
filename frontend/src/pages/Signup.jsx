// frontend/src/Signup.jsx
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import axios from 'axios';
import { API_BASE, USE_AMPLIFY } from '../api';

function Signup({ onSignupSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (USE_AMPLIFY) {
        const client = generateClient();
        // Matching the signup mutation defined in your amplify/data/resource.ts
        const signupGql = `mutation Signup($email: String!, $password: String!, $name: String!) {
          signup(email: $email, password: $password, name: $name)
        }`;

        await client.graphql({
          query: signupGql,
          variables: { email, password, name }
        });
      } else {
        // Local API Signup
        await axios.post(`${API_BASE}/auth/signup`, { email, password, name });
      }

      alert("Signup successful! Please login.");
      onSignupSuccess(); // Switches view back to login
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.errors?.[0]?.message || err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '400px', margin: '20px auto'}}>
      <h2>Signup ({USE_AMPLIFY ? 'Amplify' : 'Local'})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input type="text" placeholder="Full Name" onChange={e => setName(e.target.value)} required
        style={{width: '100%', padding: '8px', marginBottom: '10px'}} />

      <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required
        style={{width: '100%', padding: '8px', marginBottom: '10px'}} />

      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required
        style={{width: '100%', padding: '8px', marginBottom: '10px'}} />

      <button type="submit" disabled={loading} style={{width: '100%', padding: '10px'}}>
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}

export default Signup;