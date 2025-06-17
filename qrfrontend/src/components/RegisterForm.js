import React, { useState } from 'react';

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

const RegisterForm = () => {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
  });
  const [enviado, setEnviado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const id_reserv = getQueryParam('id_reserv');
  const mesa = getQueryParam('mesa');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const resp = await fetch('https://covermanager-883996440.development.catalystserverless.com/server/qrbackend/omniwallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
        })
      });

      const data = await resp.json();
      setMensaje(data.mensaje || '¡Registro procesado!');
    } catch (error) {
      setMensaje('Error en la comunicación con el servidor.');
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <div>
        <h2>{mensaje}</h2>
        <p>ID Reserva: {id_reserv}</p>
        <p>Mesa: {mesa}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <strong>ID Reserva:</strong> {id_reserv}
      </div>
      <div>
        <strong>Mesa:</strong> {mesa}
      </div>
      <input
        name="nombre"
        placeholder="Nombre"
        value={form.nombre || ''}
        onChange={handleChange}
        required
      />
      <input
        name="email"
        placeholder="Email"
        type="email"
        value={form.email || ''}
        onChange={handleChange}
        required
      />
  
      <button type="submit">Registrar</button>
    </form>
  );
};

export default RegisterForm;