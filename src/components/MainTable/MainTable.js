import React, { useState, useEffect } from 'react';
import { Table, Button, Container } from 'react-bootstrap';
import './MainTable.css';

const MainTable = () => {
    const [rows, setRows] = useState(() => {
        const savedRows = localStorage.getItem('rows');
        return savedRows ? JSON.parse(savedRows) : Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
            indexName: '',
            quantity: '', // Initialize with an empty string
            price: '', // Initialize with an empty string
            indexValue: '',
            priceGB: '',
            indexValueGB: '',
            cnCode: ''
        }));
    });
    const [cnGroups, setCnGroups] = useState({});
    const [priceSummary, setPriceSummary] = useState({});
    const [exchangeRate, setExchangeRate] = useState(0);
    const [conversionDate, setConversionDate] = useState('');
    const [exchangeRateDisplay, setExchangeRateDisplay] = useState('');

    useEffect(() => {
        if (conversionDate) {
            fetchExchangeRate();
        }
    }, [conversionDate]);

    useEffect(() => {
        localStorage.setItem('rows', JSON.stringify(rows));
    }, [rows]);

    const handleInputChange = (e, rowIndex, field) => {
        const { value } = e.target;
        const parsedValue = field !== 'indexName' ? parseFloat(value) : value; // Parse the input value to a float number if it's not the 'indexName' field
        setRows(prevRows =>
            prevRows.map((row, index) =>
                index === rowIndex ? { ...row, [field]: parsedValue } : row
            )
        );
    };

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch(`http://api.nbp.pl/api/exchangerates/rates/a/gbp/${conversionDate}`);
            const data = await response.json();
            if (data && data.rates && data.rates.length > 0) {
                const rate = data.rates[0].mid;
                setExchangeRate(rate);
                setExchangeRateDisplay(`Exchange Rate: ${rate}`);
            } else {
                setExchangeRate(0);
                setExchangeRateDisplay('Exchange Rate: N/A');
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
        }
    };

    const calculateCnGroups = () => {
        const groups = {};
        const prices = {};
        rows.forEach(row => {
            const cnGroup = row.cnCode.substring(0, 4);
            if (!groups[cnGroup]) {
                groups[cnGroup] = 0;
                prices[cnGroup] = 0;
            }
            groups[cnGroup] += parseInt(row.quantity, 10);
            prices[cnGroup] += parseFloat(row.price || 0);
        });
        setCnGroups(groups);
        setPriceSummary(prices);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        calculateCnGroups();
    };

    const addRow = () => {
        setRows([...rows, { id: rows.length + 1, indexName: '', quantity: '', price: '', indexValue: '', priceGB: '', indexValueGB: '', cnCode: '' }]);
    };

    const handleDateChange = (e) => {
        setConversionDate(e.target.value);
    };

    const calculatePriceGB = () => {
        if (exchangeRate > 0) {
            const updatedRows = rows.map(row => {
                const priceGB = parseFloat(row.price) / exchangeRate;
                return { ...row, priceGB };
            });
            setRows(updatedRows);
        }
    };

    const calculateIndexValues = () => {
        const updatedRows = rows.map(row => {
            const indexValue = parseFloat(row.price) * parseInt(row.quantity || 0, 10);
            return { ...row, indexValue };
        });
        setRows(updatedRows);
    };

    const calculateIndexValuesGB = () => {
        const updatedRows = rows.map(row => {
            const indexValueGB = parseFloat(row.priceGB) * parseInt(row.quantity || 0, 10);
            return { ...row, indexValueGB };
        });
        setRows(updatedRows);
    };

    const handleCalculateIndexValues = () => {
        calculateIndexValues();
    };

    const handleCalculateIndexValuesGB = () => {
        calculateIndexValuesGB();
    };

    const totalPrice = rows.reduce((total, row) => total + parseFloat(row.price || 0), 0);
    const totalPriceGB = rows.reduce((total, row) => total + parseFloat(row.priceGB || 0), 0);
    const totalQuantity = rows.reduce((total, row) => total + (parseInt(row.quantity, 10) || 0), 0);

    return (
        <Container>
            <form onSubmit={handleSubmit}>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Index Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Index Value</th>
                            <th>Price GB</th>
                            <th>Index Value GB</th>
                            <th>CN Code</th>
                        </tr>
                    </thead>
                    <tbody>
                    {rows.map((row, index) => (
    <tr key={row.id}>
        <td>{index + 1}</td>
        <td><input type="text" value={row.indexName} onChange={(e) => handleInputChange(e, index, 'indexName')} /></td>
        <td><input type="number" value={row.quantity} onChange={(e) => handleInputChange(e, index, 'quantity')} /></td>
        <td><input type="number" value={row.price} onChange={(e) => handleInputChange(e, index, 'price')} /></td>
        <td>{typeof row.indexValue === 'number' ? row.indexValue.toFixed(2) : 'N/A'}</td>
        <td>{typeof row.priceGB === 'number' ? row.priceGB.toFixed(2) : 'N/A'}</td>
        <td>{typeof row.indexValueGB === 'number' ? row.indexValueGB.toFixed(2) : 'N/A'}</td>
        <td><input type="text" value={row.cnCode} onChange={(e) => handleInputChange(e, index, 'cnCode')} /></td>
    </tr>
))}
                    </tbody>
                </Table>
                <Button className='mx-3 my-2' variant="dark" type="button" onClick={addRow}>Add Row</Button>
                <Button className='mx-3 my-2' variant="dark" type="submit">Submit</Button>
                <Button className='mx-3 my-2' variant="dark" type="button" onClick={calculatePriceGB}>Calculate Price GB</Button>
                <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValues}>Calculate Index Value</Button>
                <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValuesGB}>Calculate Index Value GB</Button>
                <input type="date" value={conversionDate} onChange={handleDateChange} />
                <p>{exchangeRateDisplay}</p>
            </form>
            <div>
                <div>
                    <h4>Total Summary</h4>
                    <p>Total Price: {totalPrice.toFixed(2)}</p>
                    <p>Total Price GB: {totalPriceGB.toFixed(2)}</p>
                    <p>Total Quantity: {totalQuantity}</p>
                </div>
            </div>
            <div>
                <h4>CN Groups Quantity</h4>
                <ul>
                    {Object.entries(cnGroups).map(([group, quantity]) => (
                        <li key={group}>CN Group {group}: Quantity {quantity}</li>
                    ))}
                </ul>
                <h4>CN Groups Price Summary</h4>
                <ul>
                    {Object.entries(priceSummary).map(([group, price]) => (
                        <li key={group}>CN Group {group}: Price {price.toFixed(2)}</li>
                    ))}
                </ul>
            </div>
        </Container>
    );
};

export default MainTable;