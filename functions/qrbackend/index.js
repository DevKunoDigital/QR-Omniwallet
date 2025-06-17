'use strict';

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); //  node-fetch v2

const reservaPath = path.join(__dirname, 'ultimaReserva.json');

module.exports = (req, res) => {
    if (req.method === 'POST' && req.url === '/generate-qr') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { first_name, last_name, tables, id_reserv } = data;

                if (!first_name || !last_name || !tables || !id_reserv) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Faltan datos en la reserva' }));
                    return;
                }

                // Guarda la última reserva en un archivo
                fs.writeFileSync(reservaPath, JSON.stringify({ first_name, last_name, tables, id_reserv }));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error procesando la reserva' }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/ultimo-qr') {
        if (!fs.existsSync(reservaPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No hay reserva' }));
            return;
        }
        const ultimaReserva = JSON.parse(fs.readFileSync(reservaPath, 'utf8'));
        //  la URL: apunta a /app/index.html con los parámetros
        const url = `https://covermanager-883996440.development.catalystserverless.com/app/index.html?id_reserv=${ultimaReserva.id_reserv}&mesa=${ultimaReserva.tables}`;
        QRCode.toDataURL(url).then(qrUrl => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                qrUrl,
                nombre: `${ultimaReserva.first_name} ${ultimaReserva.last_name}`,
                mesa: ultimaReserva.tables
            }));
        });
    } else if (req.method === 'POST' && req.url === '/omniwallet') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { nombre, email } = data;

                if (!email || !nombre) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ mensaje: 'Faltan datos obligatorios: email y nombre.' }));
                    return;
                }

                const omniToken = "5|UKrED62UdlgFnt92b0k9q0oamdDvmE3fx5dgcZzL5d8dee5a";
                const omniAccount = "kunodigital";
                const baseUrl = "https://api.omniwallet.cloud/v1";

                // Verificar si el usuario existe
                const existeResp = await fetch(`${baseUrl}/customers/${email}`, {
                    headers: {
                        "Authorization": `Bearer ${omniToken}`,
                        "Content-Type": "application/vnd.api+json",
                        "X-Omniwallet-Account": omniAccount
                    }
                });

                if (existeResp.status === 404) {
                    // Crear usuario con nombre y email (estructura JSON:API)
                    const crearResp = await fetch(`${baseUrl}/customers`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${omniToken}`,
                            "Content-Type": "application/vnd.api+json",
                            "X-Omniwallet-Account": omniAccount
                        },
                        body: JSON.stringify({
                            data: {
                                type: "customers",
                                attributes: {
                                    name: nombre,
                                    email: email
                                }
                            }
                        })
                    });

                    if (!crearResp.ok) {
                        const errorText = await crearResp.text();
                        console.error('Respuesta de Omniwallet:', errorText);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ mensaje: 'Error creando usuario en Omniwallet.', detalle: errorText }));
                        return;
                    }
                }

                //  Asignar puntos (estructura JSON:API)
                const externalId = Date.now().toString() + Math.random().toString(36).substring(2, 10); // ID único
                const puntosResp = await fetch(`${baseUrl}/customers/${email}/add-points`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${omniToken}`,
                        "Content-Type": "application/vnd.api+json",
                        "X-Omniwallet-Account": omniAccount
                    },
                    body: JSON.stringify({
                        points: 100,
                        type: "Custom integration",
                        external_id: externalId
                       
                    })
                });

                if (!puntosResp.ok) {
                    const errorText = await puntosResp.text();
                    console.error('Error asignando puntos:', errorText);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ mensaje: 'Error asignando puntos en Omniwallet.', detalle: errorText }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ mensaje: '¡Usuario registrado y puntos asignados!' }));

            } catch (error) {
                console.error('Error en /omniwallet:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ mensaje: 'Error en la comunicación con Omniwallet.' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    }
};