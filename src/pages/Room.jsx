import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
} from "react";
import { useSocket } from "../Providers/Socket";
import { usePeer } from "../Providers/Peer";

const RoomPage = () => {
  const { socket } = useSocket();
  const {
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream,
    resetStreamState,
    isStreamSent,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const hasJoinedRef = useRef(false);

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log("New User Joined:", emailId);
      
      if (isCalling) {
        console.log('Already calling, skipping...');
        return;
      }

      try {
        setIsCalling(true);
        const offer = await createOffer();
        socket.emit("call-user", {
          emailId,
          offer,
        });
      } catch (error) {
        console.error('Error creating offer:', error);
        setIsCalling(false);
      }
    },
    [createOffer, socket, isCalling]
  );

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("Incoming Call From:", from);

      try {
        const ans = await createAnswer(offer);
        
        if (myStream) {
          await sendStream(myStream);
        }

        socket.emit("call-accepted", {
          emailId: from,
          ans,
        });
      } catch (error) {
        console.error('Error handling incoming call:', error);
      }
    },
    [createAnswer, socket, myStream, sendStream]
  );

  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      console.log("Call Accepted");
      
      try {
        await setRemoteAnswer(ans);

        if (myStream) {
          await sendStream(myStream);
        }
      } catch (error) {
        console.error('Error handling call accepted:', error);
      }
    },
    [setRemoteAnswer, sendStream, myStream]
  );

  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Local Stream:", stream);
      setMyStream(stream);
    } catch (error) {
      console.error("Media Error:", error);
    }
  }, []);

  const joinRoom = useCallback(() => {
    if (!userEmail || !roomId) {
      console.error("Email and Room ID are required");
      return;
    }

    if (isJoining) {
      console.log('Already joining...');
      return;
    }

    if (hasJoinedRef.current) {
      console.log('Already joined this room');
      return;
    }

    setIsJoining(true);
    hasJoinedRef.current = true;

    console.log(`Joining room ${roomId} as ${userEmail}`);
    socket.emit("join-room", {
      emailId: userEmail,
      roomId: roomId,
    });

    setTimeout(() => {
      setIsJoining(false);
    }, 2000);
  }, [socket, userEmail, roomId, isJoining]);

  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Displaying Remote Stream");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket, handleNewUserJoined, handleIncomingCall, handleCallAccepted]);

  useEffect(() => {
    getUserMediaStream();
    
    return () => {

      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [getUserMediaStream]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const roomIdFromUrl = pathParts[pathParts.length - 1];
    const emailFromStorage = localStorage.getItem("userEmail") || "user@example.com";

    setRoomId(roomIdFromUrl);
    setUserEmail(emailFromStorage);

    if (roomIdFromUrl && emailFromStorage && !hasJoinedRef.current) {
      setTimeout(() => {
        socket.emit("join-room", {
          emailId: emailFromStorage,
          roomId: roomIdFromUrl,
        });
        hasJoinedRef.current = true;
      }, 1000);
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-4xl font-bold mb-8">Video Chat Room</h1>

      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Room ID: <span className="font-bold">{roomId}</span>
        </p>
        <p className="text-gray-600">
          User Email: <span className="font-bold">{userEmail}</span>
        </p>
        <button
          onClick={joinRoom}
          disabled={isJoining || hasJoinedRef.current}
          className={`mt-2 px-4 py-2 text-white rounded hover:bg-blue-600 ${
            isJoining || hasJoinedRef.current 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500'
          }`}
        >
          {isJoining ? 'Joining...' : hasJoinedRef.current ? 'Joined ✅' : 'Manually Join Room'}
        </button>
      </div>

      <div className="flex flex-wrap gap-8">
        {/* My Video */}
        <div>
          <h2 className="text-xl font-semibold mb-2">My Video</h2>
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-[500px] h-[350px] bg-black rounded-xl border shadow-lg object-cover"
          />
        </div>

        {/* Remote Video */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[500px] h-[350px] bg-black rounded-xl border shadow-lg object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;