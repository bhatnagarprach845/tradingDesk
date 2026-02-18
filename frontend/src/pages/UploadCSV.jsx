import React, { useState } from "react";
import {
  Box, Button, Typography, Container, Grid, Paper, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, createTheme, ThemeProvider,
  Alert, AlertTitle, Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
import {
  CloudUpload,
  GetApp,
  InfoOutlined,
  ErrorOutline
} from '@mui/icons-material';
import { DataGrid } from "@mui/x-data-grid";
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#9c27b0" },
    success: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    info: { main: "#0288d1" },
  },
  typography: { h4: { fontWeight: 700 }, h6: { fontWeight: 600 } },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: "none", padding: "6px 20px" } } },
    MuiDataGrid: {
      styleOverrides: {
        root: { borderRadius: 8 },
        columnHeaders: { backgroundColor: "#1976d2", color: "#fff", fontWeight: "bold" },
      },
    },
  },
});

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [symbols, setSymbols] = useState([]);
  const [validationError, setValidationError] = useState("");

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const text = await selectedFile.text();
    const firstLine = text.split('\n')[0].toLowerCase();
    const required = ['side', 'qty', 'price', 'ts'];
    const missing = required.filter(col => !firstLine.includes(col));

    if (missing.length > 0) {
      setValidationError(`Invalid Format! Missing required columns: ${missing.join(', ')}`);
      setFile(null);
      e.target.value = null;
    } else {
      setValidationError("");
      setFile(selectedFile);
    }
  };

 // ✅ NEW: Memoized calculation for PnL based on filter
  const filteredPnL = useMemo(() => {
    if (!result || !result.matches) return 0;
    const dataToSum = symbolFilter
      ? result.matches.filter(m => m.symbol === symbolFilter)
      : result.matches;

    return dataToSum.reduce((sum, row) => sum + (row.realized_pnl || 0), 0);
  }, [result, symbolFilter]);

  const upload = async () => {
    if (!file) return alert("Please select a CSV file.");

    setLoading(true);
    try {
      let csvText = await file.text();

      // ✅ FIX: Remove '$' from price/data before sending to backend
      csvText = csvText.replace(/\$/g, '');

      const token1 = localStorage.getItem('token');
      const token = `Bearer ${token1.trim()}`;

      // ✅ FIX: Explicitly pass authMode and authToken to resolve NoAuthorizationHeader
      const { data, errors } = await client.mutations.uploadCsv(
        { csvData: csvText },
        {
          authMode: 'lambda',
          authToken: token
        }
      );

      if (errors) throw new Error(errors[0].message);

      const parsedResult = JSON.parse(data);
      if (parsedResult.error) throw new Error(parsedResult.error);

      setResult(parsedResult);

      const allSymbols = [
        ...(parsedResult.matches || []),
        ...(parsedResult.remaining_lots || []),
      ].map((row) => row.symbol);

      setSymbols([...new Set(allSymbols)]);
      setSymbolFilter("");
    } catch (err) {
      console.error("Mutation Error:", err);
      alert("Upload failed: " + (err.message || "Please try again. Check if you are logged in."));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "symbol,side,qty,price,ts\n";
    const sampleData = "AAPL,BUY,10,150.00,2026-01-01T10:00:00Z\nAAPL,SELL,5,155.00,2026-01-02T12:00:00Z";
    const blob = new Blob([headers + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'fifo_template.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadFilteredCSV = (data, baseName) => {
    if (!data || data.length === 0) return alert("No data to download.");
    const filteredData = symbolFilter ? data.filter((row) => row.symbol === symbolFilter) : data;
    if (!filteredData.length) return alert("No data matches the selected symbol.");

    const displaySymbol = symbolFilter || "ALL";
    const filename = `fifo_${baseName}_${displaySymbol}.csv`;

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => headers.map(field => {
          const value = row[field];
          const isQty = field.toLowerCase().includes('qty');
          const isTs = field.toLowerCase().includes('ts'); // ✅ Prevent formatting timestamps

          if (typeof value === 'number' && !isQty && !isTs) {
            return value.toFixed(2);
          }
          return value;
      }).join(",")
    )
  ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const renderDataGrid = (title, data, type) => {
    const filteredData = symbolFilter ? data.filter((row) => row.symbol === symbolFilter) : data;
    if (!filteredData || filteredData.length === 0) return null;

    const columns = Object.keys(filteredData[0]).map((key) => {
      // ✅ FIX: Swap Header Names for Buy/Sell Price
      let displayName = key.replace(/_/g, " ").toUpperCase();
      if (key === "buy_price") displayName = "SELL PRICE";
      if (key === "sell_price") displayName = "BUY PRICE";

      return {
        field: key,
        headerName: displayName,
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => {
          const isQty = key.toLowerCase().includes('qty');
          const isTs = key.toLowerCase().includes('ts');
          if (typeof params.value === 'number' && !isQty && !isTs) {
            return params.value.toFixed(2);
          }
          return params.value;
        }
      };
    });

    const rows = filteredData.map((row, idx) => ({ id: idx, ...row }));

    return (
      <Paper sx={{ padding: 2, marginTop: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              "& .matched-row": { backgroundColor: "#d0f0c0" },
              "& .remaining-row": { backgroundColor: "#fff0b3" },
              "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#1976d2",
                },
               "& .MuiDataGrid-columnHeaderTitle": {
                  color: "black",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-iconButtonContainer": {
                  color: "white",
                },
                "& .MuiDataGrid-menuIcon": {
                  color: "white",
                }
            }}
            getRowClassName={() => type === "matched" ? "matched-row" : "remaining-row"}
          />
        </Box>
      </Paper>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ paddingY: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>FIFO SaaS Dashboard</Typography>

        <Paper variant="outlined" sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <InfoOutlined color="info" />
            <Typography variant="h6">How to Upload</Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" mb={2}>
            To calculate your PnL correctly, please ensure your CSV file follows this exact structure.
            All headers must be lowercase.
          </Typography>

          <Table size="small" sx={{ mb: 2, maxWidth: 600, backgroundColor: '#fff' }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Column</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Description</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow><TableCell>symbol</TableCell><TableCell>Text</TableCell><TableCell>Asset Ticker</TableCell></TableRow>
              <TableRow><TableCell>side</TableCell><TableCell>Text</TableCell><TableCell>BUY or SELL</TableCell></TableRow>
              <TableRow><TableCell>qty</TableCell><TableCell>Number</TableCell><TableCell>Quantity</TableCell></TableRow>
              <TableRow><TableCell>price</TableCell><TableCell>Number</TableCell><TableCell>Cost Basis</TableCell></TableRow>
              <TableRow><TableCell>ts</TableCell><TableCell>ISO Date</TableCell><TableCell>e.g. 2026-02-04T12:00:00Z</TableCell></TableRow>
            </TableBody>
          </Table>

          <Button startIcon={<GetApp />} variant="outlined" onClick={downloadTemplate}>
            Download CSV Template
          </Button>
        </Paper>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {validationError && (
            <Alert severity="error" icon={<ErrorOutline />} sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
              <AlertTitle>Validation Error</AlertTitle>
              {validationError}
            </Alert>
          )}

          <Paper sx={{ p: 4, border: '2px dashed #ccc', backgroundColor: '#fafafa' }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="raised-button-file">
              <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ mb: 2 }}>
                {file ? file.name : "Select CSV File"}
              </Button>
            </label>
            <Box mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={upload}
                disabled={loading || !file}
                sx={{ width: 200 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Run FIFO Engine"}
              </Button>
            </Box>
          </Paper>
        </Box>

        {result && (
          <>
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', textAlign: 'center' }}>
                <Typography variant="h5" color="primary">
                  {/* ✅ FIX: Display filtered PnL */}
                  {symbolFilter ? `${symbolFilter} ` : "Total "}
                  Realized PnL: <strong>${filteredPnL.toFixed(2)}</strong>
                </Typography>
            </Paper>

            <Grid container spacing={2} justifyContent="center" mb={2}>
              <Grid item>
                <Button variant="contained" color="success" onClick={() => downloadFilteredCSV(result.matches, "matched")}>
                  Download Matched
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" color="warning" onClick={() => downloadFilteredCSV(result.remaining_lots, "remaining")}>
                  Download Remaining
                </Button>
              </Grid>
              <Grid item>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Filter by Symbol</InputLabel>
                  <Select value={symbolFilter} label="Filter by Symbol" onChange={(e) => setSymbolFilter(e.target.value)}>
                    <MenuItem value="">All Assets</MenuItem>
                    {symbols.map((sym) => <MenuItem key={sym} value={sym}>{sym}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {renderDataGrid("Matched Lots Preview", result.matches, "matched")}
            {renderDataGrid("Remaining Lots Preview", result.remaining_lots, "remaining")}
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}