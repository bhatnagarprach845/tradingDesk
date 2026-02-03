import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('upload'); // Default view when logged in

  // Replace this with your actual admin email
  const ADMIN_EMAIL = "prachi.bhatnagar845@gmail.com";

  const handleLogin = (jwt, userEmail) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('userEmail', userEmail); // Store email to check admin status
    setToken(jwt);
    setView('upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setView('login');
  };

  // Check if the current user should see the admin button
  const isAdmin = localStorage.getItem('userEmail') === ADMIN_EMAIL;

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h1>FIFO SaaS</h1>

      {token ? (
        <>
          <div style={{ textAlign: 'right', marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setView('upload')}>Home</button>

            {/* ✅ Only shows the Admin button if you are the admin */}
            {isAdmin && (
              <button
                onClick={() => setView('admin')}
                style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Admin Dashboard
              </button>
            )}

            <button onClick={handleLogout}>Logout</button>
          </div>

          {view === 'admin' && isAdmin ? (
            <AdminDashboard token={token} />
          ) : (
            <UploadCSV token={token} />
          )}
        </>
      ) : (
        <>
          {view === 'login' ? (
            // Pass a function to Login.jsx that captures the email
            <Login onLogin={(jwt, email) => handleLogin(jwt, email)} />
          ) : (
            <Signup onSignupSuccess={() => setView('login')} />
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span>{view === 'login' ? "Don't have an account ?" : "Already have an account ?"} </span>
            <button
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {view === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}