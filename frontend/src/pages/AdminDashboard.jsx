import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Container, Typography, Paper, Box, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { fetchAuthSession } from 'aws-amplify/auth';

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

    // ✅ Force the list query to use your manual JWT
    const { data: items, errors } = await client.models.User.list({
      headers: {
        Authorization: storedToken // Or `Bearer ${storedToken}` if your Lambda expects that
      }
    });

    if (errors) {
      // If you see "Unauthorized" here, the token is sent but the
      // Admin Group rule in your schema is rejecting it.
      console.error("GraphQL Errors:", errors);
      return;
    }

    console.log("Users fetched successfully:", items);
    setUsers(items);
  } catch (err) {
    // This is where 'NoValidAuthTokens' was being thrown
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
              getRowId={(row) => row.id}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}