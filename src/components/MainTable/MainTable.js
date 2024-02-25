import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Dropdown } from 'react-bootstrap';
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
    const [language, setLanguage] = useState('en'); // Default language is English
    const [exchangeRate, setExchangeRate] = useState(0);
    const [conversionDate, setConversionDate] = useState('');
    const [exchangeRateDisplay, setExchangeRateDisplay] = useState('');

    const handleLanguageChange = (selectedLanguage) => {
        setLanguage(selectedLanguage);
    };

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
            const response = await fetch(`https://cors-anywhere.herokuapp.com/http://api.nbp.pl/api/exchangerates/rates/a/gbp/${conversionDate}`);
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

        rows.forEach(row => {
            // Convert to string and then extract first 4 characters
            const cnCode = String(row.cnCode);
            const cnGroup = cnCode.substring(0, 4);
            const indexValue = parseFloat(row.indexValue || 0); // Use indexValue instead of recalculating from price and quantity
            const indexValueGB = parseFloat(row.indexValueGB || 0); // Use indexValueGB directly

            if (!groups[cnGroup]) {
                groups[cnGroup] = {
                    quantity: parseFloat(row.quantity || 0),
                    indexValue: indexValue,
                    indexValueGB: indexValueGB
                };
            } else {
                groups[cnGroup].quantity += parseFloat(row.quantity || 0);
                groups[cnGroup].indexValue += indexValue;
                groups[cnGroup].indexValueGB += indexValueGB;
            }
        });

        return groups;
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        const calculatedGroups = calculateCnGroups();
        setCnGroups(calculatedGroups);
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
            const indexValueGB = parseFloat(row.quantity || 0) * parseFloat(row.priceGB || 0);
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

    const handleSaveData = () => {
        const dataToSave = {
            rows,
            conversionDate,
            exchangeRate
        };
        const jsonData = JSON.stringify(dataToSave);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tableData.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            setRows(data.rows || []);
            setConversionDate(data.conversionDate || '');
            setExchangeRate(data.exchangeRate || 0);
        };
        reader.readAsText(file);
    };


    return (
        <Container>
            <Dropdown onSelect={handleLanguageChange} className='m-5'>
                <Dropdown.Toggle variant="dark" id="language-dropdown">
                {language === 'en' ? 'Select Language' : 'Wybierz język'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey="en">EN</Dropdown.Item>
                    <Dropdown.Item eventKey="pl">PL</Dropdown.Item>
                    {/* Add more language options */}
                </Dropdown.Menu>
            </Dropdown>
            {language === 'en' && (
                <>

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
                                        <td><input type="number" value={row.cnCode} onChange={(e) => handleInputChange(e, index, 'cnCode')} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={addRow}>Add Row</Button>
                        <Button className='mx-3 my-2' variant="dark" type="submit">Submit</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={calculatePriceGB}>Calculate Price GB</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValues}>Calculate Index Value</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValuesGB}>Calculate Index Value GB</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleSaveData}>Save Data</Button>
                        <label htmlFor="fileInput" className="btn btn-dark">Choose File</label>
                        <input id="fileInput" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                        <div>
                            <span>choose exchange date: </span><input type="date" value={conversionDate} onChange={handleDateChange} />
                            <p>{exchangeRateDisplay}</p>
                        </div>

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
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h4>CN Groups Quantity</h4>
                                <ul>
                                    {Object.entries(cnGroups).map(([group, { quantity }]) => {
                                        if (group && quantity > 0) {
                                            return <li key={group}>CN Group {group}: Quantity {quantity}</li>;
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                            <div>
                                <h4>CN Groups Value Summary</h4>
                                <ul>
                                    {Object.entries(cnGroups).map(([group, { indexValue, indexValueGB }]) => {
                                        if (group && (indexValue > 0 || indexValueGB > 0)) {
                                            return <li key={group}>CN Group {group}: Value {indexValue.toFixed(2)} Value GB: {indexValueGB.toFixed(2)}</li>;
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {language === 'pl' && (

                <>
                    <form onSubmit={handleSubmit}>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Lp.</th>
                                    <th>Nazwa indeksu</th>
                                    <th>Ilość</th>
                                    <th>Cena</th>
                                    <th>Wartość pozycji</th>
                                    <th>Cena GB</th>
                                    <th>Wartość pozycji GB</th>
                                    <th>Kod CN</th>
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
                                        <td><input type="number" value={row.cnCode} onChange={(e) => handleInputChange(e, index, 'cnCode')} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={addRow}>Powiększ tabelę</Button>
                        <Button className='mx-3 my-2' variant="dark" type="submit">Grupuj CN</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={calculatePriceGB}>Przelicz ceny GB</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValues}>Przelicz wortość pozycji</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleCalculateIndexValuesGB}>Przelicz wartość pozycji GB</Button>
                        <Button className='mx-3 my-2' variant="dark" type="button" onClick={handleSaveData}>Zapisz dane</Button>
                        <label htmlFor="fileInput" className="btn btn-dark">Załaduj plik</label>
                        <input id="fileInput" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                        <div>
                            <span>wybierz datę do pobrania kursu: </span><input type="date" value={conversionDate} onChange={handleDateChange} />
                            <p>{exchangeRateDisplay}</p>
                        </div>

                    </form>
                    <div>
                        <div>
                            <h4>Podsumowanie</h4>
                            <p>Wartość PLN: {totalPrice.toFixed(2)}</p>
                            <p>Wartość GB: {totalPriceGB.toFixed(2)}</p>
                            <p>Wartość całkowita: {totalQuantity}</p>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h4>Podsumowanie ilości grupy  kodów CN</h4>
                                <ul>
                                    {Object.entries(cnGroups).map(([group, { quantity }]) => {
                                        if (group && quantity > 0) {
                                            return <li key={group}>Grupa CN {group}: Ilość {quantity}</li>;
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                            <div>
                                <h4>Podsumowanie wartości grupy kodów CN</h4>
                                <ul>
                                    {Object.entries(cnGroups).map(([group, { indexValue, indexValueGB }]) => {
                                        if (group && (indexValue > 0 || indexValueGB > 0)) {
                                            return <li key={group}>Grupa CN {group}: Wartość {indexValue.toFixed(2)} Wartość GB: {indexValueGB.toFixed(2)}</li>;
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Container>
    );
};

export default MainTable;