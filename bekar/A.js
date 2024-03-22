import React, { useEffect } from 'react';
import io from 'socket.io-client';

export default function A() {
  useEffect(() => {
    // Establish a Socket.IO connection
    const socket = io('http://localhost:8080');

    // Event listener for receiving messages
    socket.on('isLoggedIn', (message) => {
      const allMessages = document.getElementById('messages');
      const p = document.createElement('p');
      p.innerText = message;
      allMessages.appendChild(p);
    });

    // Cleanup the socket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>Socket.IO Message Receiver</h1>
      <div id="messages"></div>
    </div>
  );
}
