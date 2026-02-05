import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Container, Typography, Paper, Box, CircularProgress, Alert, Paper,
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
    const token = localStorage.getItem('token');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Ensure 'Bearer ' is present
      },
      body: JSON.stringify({
        query: `query ListUsers {
          listUsers {
            items {
              email
              name
              createdAt
            }
          }
        }`
      })
    });

    const result = await response.json();

    if (response.status === 401) {
      throw new Error("Unauthorized: Your token is invalid or you are not an Admin.");
    }

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    setUsers(result.data.listUsers.items || []);
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
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