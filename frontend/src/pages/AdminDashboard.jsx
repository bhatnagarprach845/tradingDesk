import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Container, Typography, Paper, Box, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { fetchAuthSession } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api'; // Import the raw post tool

const client = generateClient();

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      console.error("No token found in localStorage. Please login.");
      return;
    }

    // Define the raw GraphQL query string
    const listUsersQuery = `
      query ListUsers {
        listUsers {
          items {
            email
            name
            createdAt
          }
        }
      }
    `;

    // Use the low-level API post to send the request
    const restOperation = post({
      apiName: 'data', // This should match your API name in outputs
      path: '/graphql',
      options: {
        body: { query: listUsersQuery },
        headers: {
          Authorization: `Bearer ${token}`
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