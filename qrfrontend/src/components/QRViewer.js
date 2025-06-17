import React, { useEffect, useState } from 'react';

const QRViewer = () => {
    const [qrUrl, setQrUrl] = useState(null);
    const [nombre, setNombre] = useState('');
    const [mesa, setMesa] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQR = async () => {
            try {
                const resp = await fetch('https://covermanager-883996440.development.catalystserverless.com/server/qrbackend/ultimo-qr');
                const data = await resp.json();
                if (data.qrUrl) {
                    setQrUrl(data.qrUrl);
                    setNombre(data.nombre);
                    setMesa(data.mesa);
                } else {
                    setError('No hay QR disponible');
                }
            } catch {
                setError('Error obteniendo el QR');
            }
        };
        fetchQR();
    }, []);

    if (error) return <div>{error}</div>;

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Reserva a nombre de: {nombre}</h2>
            <h3>Mesa: {mesa}</h3>
            {qrUrl && <img src={qrUrl} alt="Código QR" style={{ width: 250, height: 250 }} />}
        </div>
    );
};

export default QRViewer;