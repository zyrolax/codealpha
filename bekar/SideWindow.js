import React from 'react';
import { Nav, Card } from 'react-bootstrap';
import { BsFillGrid3X3GapFill, BsClockHistory, BsPeople, BsChatDots } from 'react-icons/bs';

function SideWindow() {
  return (
    <Card
      style={{
        position: 'fixed',
        height: '100vh',
        top: '40px',
        backgroundColor: '#292b2c',

      }}
    >
      <Card.Body>
        <Nav
          className="flex-column bg-dark text-light"
          style={{
            width: '250px',
            position: 'fixed',
            left: 0,
            height: 'calc(100vh - 56px)',
            padding: '20px',
          }}
        >
          <Nav.Item style={{ marginBottom: '15px' }}>
            <Nav.Link
              className="text-light"
              href="/"
              
            >
              <BsFillGrid3X3GapFill size={20} style={{ marginRight: '10px' }} /> Home
            </Nav.Link>
          </Nav.Item>
          <Nav.Item style={{ marginBottom: '15px' }}>
            <Nav.Link
              className="text-light"
              href="/history"
              >
              <BsClockHistory size={20} style={{ marginRight: '10px' }} /> History
            </Nav.Link>
          </Nav.Item>
          <Nav.Item style={{ marginBottom: '15px' }}>
            <Nav.Link
              className="text-light"
              href="/participants"
              
            >
              <BsPeople size={20} style={{ marginRight: '10px' }} /> Participants
            </Nav.Link>
          </Nav.Item>
          <Nav.Item style={{ marginBottom: '15px' }}>
            <Nav.Link
              className="text-light"
              href="/chat"
              
            >
              <BsChatDots size={20} style={{ marginRight: '10px' }} /> Chat
            </Nav.Link>
          </Nav.Item>
          {/* Add more Nav.Item for other debating-related sidebar items */}
        </Nav>
      </Card.Body>
    </Card>
  );
}

export default SideWindow;
