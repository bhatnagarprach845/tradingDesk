import React, { useState } from 'react';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import UploadCSV from './UploadCSV.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');

  const handleLogin = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    setView('upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1>FIFO SaaS</h1>

      {token ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <UploadCSV token={token} />
        </>
      ) : (
        <>
          {view === 'login' ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Signup onSignup={() => setView('login')} />
          )}
          <button onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
            Switch to {view === 'login' ? 'Signup' : 'Login'}
          </button>
        </>
      )}
    </div>
  );
}

export default App;