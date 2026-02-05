import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Container, Typography, Paper, Box, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api'; // Import the raw post tool
import { Amplify } from 'aws-amplify';

const client = generateClient();

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const config = Amplify.getConfig();
    if (!config.API?.REST?.AdminAPI) {
        console.error("AdminAPI is not configured in Amplify.");
        setError("Configuration Error: Please contact support.");
        return;
      }
    setLoading(true);
    try {
        const storedToken = localStorage.getItem('token');

        if (!storedToken) {
          console.error("No token found in localStorage. Please login.");
          return;
        }

        const restOperation = post({
          apiName: 'AdminAPI', // Reference the nickname from main.jsx
          path: '',           // Empty because the endpoint is the full URL
          options: {
            body: {
              query: `query ListUsers { listUsers { items { email name createdAt } } }`
            },
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          }
        });

        const { body } = await restOperation.response;
        const result = await body.json();

        if (result.errors) {
          console.error("GraphQL Errors:", result.errors);
        } else {
          setUsers(result.data.listUsers.items);
        }
   } catch (err) {
       console.error("Fetch Error:", err);
   } finally {
    setLoading(false);
   }
};

  const columns = [
    { field: "email", headerName: "Email", width: 250 },
    { field: "name", headerName: "Name", width: 200 },
    { field: "createdAt", headerName: "Signed Up", width: 200 },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>Admin: User Management</Typography>
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={users}
              columns={columns}
              pageSize={10}
              getRowId={(row) => row.email}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}