import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Container, Typography, Paper, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api'; // Import the raw post tool
import { Amplify } from 'aws-amplify';

const client = generateClient();

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
  const config = Amplify.getConfig();
  const endpoint = config.API?.GraphQL?.endpoint;

  if (!endpoint) {
    setError("API Configuration not found.");
    setLoading(false);
    return;
  }

  setLoading(true);
  setError("");

    try {
      // 1. Retrieve the token and format it as 'Bearer <token>'
      const rawToken = localStorage.getItem('token');
      if (!rawToken) throw new Error("No session found. Please login.");

      const authHeader = `Bearer ${rawToken.trim()}`;

      // 2. Use the typed client instead of raw fetch
      // This automatically handles endpoint discovery and JSON parsing
      const { data, errors } = await client.queries.adminFetchAllUsers(
        {}, // Custom queries require an empty object if no arguments are defined
        {
          authMode: 'lambda',
          authToken: authHeader // Explicitly provide the token for the Lambda Authorizer
        }
      );

      // 3. Handle GraphQL errors (e.g., unauthorized fields)
      if (errors) {
        console.error("GraphQL Errors:", errors);
        throw new Error(errors[0].message);
      }

      // 4. Update state with the result (returns a flat array for custom queries)
      setUsers(data || []);

    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>User Management</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, i) => (
              <TableRow key={i}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name || '—'}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}