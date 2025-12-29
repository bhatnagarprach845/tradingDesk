const createCustomer = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/billing/create_customer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};


const createSubscription = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/billing/create_subscription`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};