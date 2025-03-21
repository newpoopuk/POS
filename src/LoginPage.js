import React, { useState } from 'react';
import { Container, Card, Form, Button, Modal } from 'react-bootstrap';
import axios from 'axios'; // Import axios for API requests
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false); // Modal for errors
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/users/authenticate/', {
        username: username,
        password: password,
      });

      console.log('Login successful:', response.data);
      setLoading(false);
      // Pass customer_name and key to App.js
      onLogin(response.data.customer_name, response.data.key, response.data.agentId);

    } catch (err) {
      console.error('Error logging in:', err);
      setError('Invalid username or password.');
      setShowModal(true);
      setLoading(false);
    }
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };
  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100">
      <Card className="shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4">Ordering/Supply Chain Automated system</h3>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button type="submit" className="w-100" variant="primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
      </Card>

      {/* Modal for error pop-up */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>{error}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LoginPage;
