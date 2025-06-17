import React from 'react';
import QRViewer from './components/QRViewer';
import RegisterForm from './components/RegisterForm';

function App() {
  const params = new URLSearchParams(window.location.search);
  const id_reserv = params.get('id_reserv');
  const mesa = params.get('mesa');

  if (id_reserv && mesa) {
    return <RegisterForm />;
  }
  return <QRViewer />;
}

export default App;