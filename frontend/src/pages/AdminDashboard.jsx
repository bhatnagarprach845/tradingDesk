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
    try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.accessToken?.payload['cognito:groups'];
        console.log("My Cognito Groups:", groups);

        if (!groups || !groups.includes('Admins')) {
          console.error("User is NOT in the Admins group according to the current session.");
        }
        // ✅ ADD THIS: Explicitly use userPool auth mode
        // Fetches the list of users from your DynamoDB table
        const { data: items, errors } = await client.models.User.list({
          authMode: 'userPool'
        });
      if (errors) throw new Error(errors[0].message);
      setUsers(items);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 220 },
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