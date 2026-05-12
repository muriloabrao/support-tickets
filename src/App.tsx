import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TicketForm from './components/TicketForm';
import Feedback from './components/Feedback';
import TicketDetails from './components/TicketDetails';
import Reports from './components/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/novo-chamado" element={<Layout><TicketForm /></Layout>} />
        <Route path="/ticket/:ticketId" element={<Layout><TicketDetails /></Layout>} />
        <Route path="/feedback/:ticketId" element={<Layout><Feedback /></Layout>} />
        <Route path="/relatorios" element={<Layout><Reports /></Layout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
