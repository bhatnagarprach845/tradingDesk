import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Grid,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

// ----------------------
// Custom professional theme
// ----------------------
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },   // blue
    secondary: { main: "#9c27b0" }, // purple
    success: { main: "#2e7d32" },   // dark green
    warning: { main: "#ed6c02" },   // orange
    info: { main: "#0288d1" },      // teal
  },
  typography: {
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          padding: "6px 20px",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        columnHeaders: {
          backgroundColor: "#1976d2",
          color: "#fff",
          fontWeight: "bold",
        },
        row: {
          "&.matched-row": { backgroundColor: "#d0f0c0" },
          "&.remaining-row": { backgroundColor: "#fff0b3" },
        },
      },
    },
  },
});

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setAuthToken(storedToken);
  }, []);

  const upload = async () => {
    if (!authToken) return alert("Authentication token missing. Please login.");
    if (!file) return alert("Please select a CSV file.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/upload/upload_csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      setResult(res.data);

      const allSymbols = [
        ...(res.data.preview?.matches || []),
        ...(res.data.preview?.remaining_lots || []),
      ].map((row) => row.symbol);
      setSymbols([...new Set(allSymbols)]);
      setSymbolFilter("");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFilteredCSV = (data, filename) => {
    if (!data || data.length === 0) return alert("No data to download.");

    const filteredData = symbolFilter ? data.filter((row) => row.symbol === symbolFilter) : data;
    if (!filteredData.length) return alert("No data matches the selected symbol.");

    const csvRows = [];
    const headers = Object.keys(filteredData[0]);
    csvRows.push(headers.join(","));
    filteredData.forEach((row) => {
      csvRows.push(headers.map((field) => row[field]).join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const filterBySymbol = (data) => {
    if (!symbolFilter) return data;
    return data.filter((row) => row.symbol === symbolFilter);
  };

  const renderDataGrid = (title, data, type) => {
    const filteredData = filterBySymbol(data);
    if (!filteredData || filteredData.length === 0) return null;

    const columns = Object.keys(filteredData[0]).map((key) => ({
      field: key,
      headerName: key.replace(/_/g, " ").toUpperCase(),
      flex: 1,
      minWidth: 120,
    }));

    const rows = filteredData.map((row, idx) => ({ id: idx, ...row }));

    return (
      <Paper sx={{ padding: 2, marginTop: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowClassName={() =>
              type === "matched" ? "matched-row" : type === "remaining" ? "remaining-row" : ""
            }
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.primary.main,
                color: "#fff",
                fontWeight: "bold",
              },
              "& .matched-row": { backgroundColor: "#d0f0c0" },
              "& .remaining-row": { backgroundColor: "#fff0b3" },
            }}
          />
        </Box>
      </Paper>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ paddingY: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>
          FIFO Upload
        </Typography>

        <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={3}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".csv" />
          <Button variant="contained" color="primary" onClick={upload}>
            Upload CSV
          </Button>
          {loading && <CircularProgress size={24} />}
        </Box>

        {result && (
          <>
            <Typography variant="h6" color="primary" align="center" gutterBottom>
              Total PnL: ${result.total_realized_pnl}
            </Typography>

            <Grid container spacing={2} justifyContent="center" mb={2}>
              <Grid item>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() =>
                    downloadFilteredCSV(
                      result.preview.matches,
                      `fifo_matched_lots${symbolFilter ? `_${symbolFilter}` : ""}.csv`
                    )
                  }
                >
                  Download Matched Lots
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() =>
                    downloadFilteredCSV(
                      result.preview.remaining_lots,
                      `fifo_remaining_lots${symbolFilter ? `_${symbolFilter}` : ""}.csv`
                    )
                  }
                >
                  Download Remaining Lots
                </Button>
              </Grid>
              <Grid item>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Filter by Symbol</InputLabel>
                  <Select
                    value={symbolFilter}
                    label="Filter by Symbol"
                    onChange={(e) => setSymbolFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {symbols.map((sym) => (
                      <MenuItem key={sym} value={sym}>
                        {sym}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {renderDataGrid("Matched Lots Preview", result.preview.matches, "matched")}
            {renderDataGrid("Remaining Lots Preview", result.preview.remaining_lots, "remaining")}
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
