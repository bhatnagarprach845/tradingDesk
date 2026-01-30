import React, { useState } from 'react';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import UploadCSV from './UploadCSV.jsx';
import { useEffect } from 'react';



// frontend/src/App.jsx (updated snippet)
// ... same imports ...

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');

  const handleLogin = (jwt) => {
    localStorage.setItem('token', jwt);
    setToken(jwt);
    // No need to set view here as token presence handles the UI
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
          <div style={{textAlign: 'right'}}>
            <button onClick={handleLogout}>Logout</button>
          </div>
          <UploadCSV token={token} />
        </>
      ) : (
        <>
          {view === 'login' ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Signup onSignupSuccess={() => setView('login')} />
          )}

          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <span>{view === 'login' ? "Don't have an account?" : "Already have an account?"} </span>
            <button
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              style={{background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer'}}
            >
              {view === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;