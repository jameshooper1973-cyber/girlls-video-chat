import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Send, Copy, MessageCircle, X } from 'lucide-react';

export default function GirlyVideoChat() {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [myRoomCode, setMyRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [peerId, setPeerId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [call, setCall] = useState(null);
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dataConnectionRef = useRef(null);

  // Generate random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Initialize PeerJS
  useEffect(() => {
    // Note: Using public PeerJS server for demo
    // For production, consider hosting your own PeerServer
    const newPeer = new window.Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log('My peer ID:', id);
    });

    newPeer.on('call', (incomingCall) => {
      if (localStream) {
        incomingCall.answer(localStream);
        setCall(incomingCall);
        setConnectionStatus('connected');
        
        incomingCall.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      }
    });

    newPeer.on('connection', (conn) => {
      dataConnectionRef.current = conn;
      setConnection(conn);
      
      conn.on('data', (data) => {
        if (data.type === 'message') {
          setMessages(prev => [...prev, { text: data.text, sender: 'friend', time: new Date() }]);
          if (!showChat) {
            setUnreadMessages(prev => prev + 1);
          }
        }
      });

      conn.on('open', () => {
        setConnectionStatus('connected');
      });
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
      alert('Connection error. Please try again!');
    });

    setPeer(newPeer);

    return () => {
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, [localStream, showChat]);

  // Start local camera
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Please allow camera and microphone access!');
      console.error('Error accessing media devices:', err);
    }
  };

  useEffect(() => {
    startLocalStream();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create room
  const createRoom = () => {
    if (!username.trim()) {
      alert('Please enter your name first! 💕');
      return;
    }
    if (!peerId) {
      alert('Connecting... Please wait a moment! ✨');
      return;
    }
    const code = peerId.substring(0, 8).toUpperCase();
    setMyRoomCode(code);
    setIsInCall(true);
    setConnectionStatus('waiting');
  };

  // Join room
  const joinRoom = () => {
    if (!username.trim()) {
      alert('Please enter your name first! 💕');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter a room code! ✨');
      return;
    }
    if (!peerId || !localStream) {
      alert('Connecting... Please wait! 💫');
      return;
    }

    setIsInCall(true);
    setConnectionStatus('connecting');

    // Make video call
    const outgoingCall = peer.call(roomCode.toLowerCase(), localStream);
    setCall(outgoingCall);

    outgoingCall.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setConnectionStatus('connected');
    });

    // Establish data connection for messages
    const conn = peer.connect(roomCode.toLowerCase());
    dataConnectionRef.current = conn;
    setConnection(conn);

    conn.on('open', () => {
      setConnectionStatus('connected');
    });

    conn.on('data', (data) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, { text: data.text, sender: 'friend', time: new Date() }]);
        if (!showChat) {
          setUnreadMessages(prev => prev + 1);
        }
      }
    });
  };

  // Copy room code
  const copyRoomCode = () => {
    const code = myRoomCode || (peerId ? peerId.substring(0, 8).toUpperCase() : '');
    setMessageInput(`Join my video chat! Code: ${code} 💕`);
    alert('Code copied to message! Now you can add more text and send! ✨');
  };

  // Send message
  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      text: messageInput,
      sender: 'me',
      time: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    if (dataConnectionRef.current && dataConnectionRef.current.open) {
      dataConnectionRef.current.send({
        type: 'message',
        text: messageInput
      });
    }

    setMessageInput('');
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioOn(audioTrack.enabled);
    }
  };

  // Toggle chat
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadMessages(0);
    }
  };

  // End call
  const endCall = () => {
    if (call) {
      call.close();
    }
    if (dataConnectionRef.current) {
      dataConnectionRef.current.close();
    }
    setIsInCall(false);
    setMyRoomCode('');
    setRoomCode('');
    setMessages([]);
    setConnectionStatus('disconnected');
    setShowChat(false);
    setUnreadMessages(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
          Girls' Video Chat 💕
        </h1>
        <p className="text-purple-600 font-semibold">Chat with your besties! ✨</p>
      </div>

      {!isInCall ? (
        /* Login Screen */
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 border-4 border-pink-300">
            <div className="mb-6">
              <label className="block text-purple-600 font-bold mb-2 text-lg">
                Your Name 💕
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-2xl border-2 border-pink-300 focus:border-purple-400 outline-none text-lg"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={createRoom}
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Video size={24} />
                Create Room
              </button>

              <div className="text-center text-purple-500 font-semibold">OR</div>

              <button
                onClick={() => setShowJoinRoom(!showJoinRoom)}
                className="w-full bg-gradient-to-r from-blue-400 to-teal-400 hover:from-blue-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Phone size={24} />
                Join Friend's Room
              </button>

              {showJoinRoom && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toLowerCase())}
                    placeholder="Enter room code..."
                    className="w-full px-4 py-3 rounded-2xl border-2 border-blue-300 focus:border-teal-400 outline-none text-lg text-center font-bold"
                  />
                  <button
                    onClick={joinRoom}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-2xl shadow-lg"
                  >
                    Join Now! ✨
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 bg-white/90 backdrop-blur rounded-3xl shadow-xl p-4 border-4 border-purple-300">
            <p className="text-center text-purple-600 font-bold mb-2">Camera Preview</p>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-2xl bg-gray-900"
            />
          </div>
        </div>
      ) : (
        /* Video Call Screen */
        <div className="max-w-6xl mx-auto">
          {/* Room Code Display */}
          {myRoomCode && (
            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 mb-4 border-2 border-pink-300">
              <p className="text-purple-600 font-semibold mb-2 text-center">Share this code with your friend:</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-pink-500">{myRoomCode}</p>
                <button
                  onClick={copyRoomCode}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg"
                  title="Copy code to message"
                >
                  <Copy size={20} />
                </button>
              </div>
              <p className="text-center text-sm text-purple-500 mt-2">
                {connectionStatus === 'waiting' ? '⏳ Waiting for friend...' : ''}
                {connectionStatus === 'connecting' ? '🔄 Connecting...' : ''}
                {connectionStatus === 'connected' ? '✅ Connected!' : ''}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Remote Video (Friend) */}
            <div className="relative bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl p-1 shadow-2xl">
              <div className="bg-gray-900 rounded-3xl overflow-hidden relative aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-pink-500/90 px-4 py-2 rounded-full">
                  <p className="text-white font-bold">Friend 👯‍♀️</p>
                </div>
                {connectionStatus !== 'connected' && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-bold bg-gray-900/50">
                    {connectionStatus === 'waiting' ? 'Waiting for friend... 💫' : ''}
                    {connectionStatus === 'connecting' ? 'Connecting... 🔄' : ''}
                    {connectionStatus === 'disconnected' ? 'Disconnected 😢' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Local Video (You) */}
            <div className="relative bg-gradient-to-br from-blue-400 to-teal-400 rounded-3xl p-1 shadow-2xl">
              <div className="bg-gray-900 rounded-3xl overflow-hidden relative aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-teal-500/90 px-4 py-2 rounded-full">
                  <p className="text-white font-bold">{username} (You) 💖</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border-4 border-purple-300 mb-4">
            <div className="flex justify-center items-center gap-4 flex-wrap">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full shadow-lg transform hover:scale-110 transition-all ${
                  isVideoOn
                    ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isVideoOn ? <Video size={28} /> : <VideoOff size={28} />}
              </button>

              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full shadow-lg transform hover:scale-110 transition-all ${
                  isAudioOn
                    ? 'bg-gradient-to-r from-blue-400 to-teal-400 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isAudioOn ? <Mic size={28} /> : <MicOff size={28} />}
              </button>

              <button
                onClick={toggleChat}
                className="relative p-4 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg transform hover:scale-110 transition-all"
              >
                <MessageCircle size={28} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={endCall}
                className="p-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg transform hover:scale-110 transition-all"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="bg-white/90 backdrop-blur rounded-3xl p-4 border-4 border-pink-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-purple-600">Messages 💬</h3>
                <button onClick={toggleChat} className="text-purple-500 hover:text-purple-700">
                  <X size={24} />
                </button>
              </div>

              {/* Messages */}
              <div className="h-64 overflow-y-auto mb-4 space-y-2 bg-purple-50 rounded-2xl p-3">
                {messages.length === 0 ? (
                  <p className="text-center text-purple-400 py-8">No messages yet! Say hi! 👋</p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          msg.sender === 'me'
                            ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                            : 'bg-white text-purple-600 border-2 border-purple-300'
                        }`}
                      >
                        <p className="font-semibold text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-pink-300 focus:border-purple-400 outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white p-3 rounded-2xl shadow-lg"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
