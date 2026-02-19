import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import {
  Container, Typography, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
// ✅ Import session and user helpers
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

const client = generateClient();

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const session = await fetchAuthSession();
        // Cognito stores groups in the 'payload' of the access/id token
        const groups = session.tokens.accessToken.payload['cognito:groups'] || [];

        if (groups.includes('Admin')) {
          // ✅ Success: The user is a confirmed Admin
          fetchUsers();
        } else {
          // ❌ Denied: User is logged in, but not an Admin
          setError("Access Denied.");
        }
      } catch (err) {
        setError("Session expired. Please log in.");
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      // ✅ FIX: Get the fresh JWT token directly from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (!token) throw new Error("Session expired. Please log in again.");

      const authHeader = `Bearer ${token}`;

      // Call custom GraphQL query via the Gen 2 client
      const { data, errors } = await client.queries.adminFetchAllUsers(
        {},
        {
          authMode: 'lambda',
          authToken: authHeader
        }
      );

      if (errors) throw new Error(errors[0].message);

      setUsers(data || []);

    } catch (err) {
      console.error("Admin Fetch Error:", err);
      setError(err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        User Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Joined Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user, i) => (
                <TableRow key={user.email || i} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name || '—'}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}