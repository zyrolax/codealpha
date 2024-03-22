import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:8080'); // Adjust the URL accordingly
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = () => {
    if (socket && messageInput.trim() !== '') {
      socket.emit('user-message', messageInput);
      setMessageInput('');
    }
  };

  return (
    <div>
      <h1>Chat App</h1>

      <div>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>

      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Enter Message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
