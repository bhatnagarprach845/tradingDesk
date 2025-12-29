import React, { useState } from 'react';
import axios from 'axios';

function Signup({ onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd) => {
    // At least 8 chars, one number, one uppercase, one lowercase
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters long and include uppercase, lowercase, and a number.'
      );
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:8000/auth/signup', { email, password });
      setSuccess('Signup successful! Please login.');
      onSignup();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Signup</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <br />

      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Signup'}
      </button>
    </form>
  );
}

export default Signup;