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
    handleRemoteIceCandidate,
    setTargetEmail,
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUserEmail, setRemoteUserEmail] = useState(null);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const isCallingRef = useRef(false);

  useEffect(() => {
    const handleIceCandidate = ({ candidate }) => {
      console.log("Received ICE candidate from peer");
      handleRemoteIceCandidate(candidate);
    };

    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, handleRemoteIceCandidate]);

  
  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log("New User Joined:", emailId);
      
      if (isCallingRef.current) {
        console.log("Already calling, skipping...");
        return;
      }

      try {
        isCallingRef.current = true;
        setRemoteUserEmail(emailId);
        setTargetEmail(emailId);

        if (!myStream) {
          console.log("Waiting for local stream...");
          return;
        }

        console.log("Creating offer for:", emailId);
        const offer = await createOffer();
        
        console.log("Sending offer to:", emailId);
        socket.emit("call-user", {
          emailId,
          offer,
        });
        
        await sendStream(myStream);
        console.log("Stream sent to:", emailId);
        
      } catch (error) {
        console.error("Error creating offer:", error);
        isCallingRef.current = false;
      }
    },
    [createOffer, socket, myStream, sendStream, setTargetEmail]
  );

  
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("Incoming Call From:", from);

      try {
        setRemoteUserEmail(from);
        setTargetEmail(from);

        console.log("Creating answer for:", from);
        const ans = await createAnswer(offer);
        
        console.log("Sending answer to:", from);
        socket.emit("call-accepted", {
          emailId: from,
          ans,
        });
        
        if (myStream) {
          await sendStream(myStream);
          console.log("Stream sent to:", from);
        }
        
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [createAnswer, socket, myStream, sendStream, setTargetEmail]
  );


  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      console.log("Call Accepted");
      
      try {
        await setRemoteAnswer(ans);
        console.log("Remote answer set");
        setIsConnected(true);
      } catch (error) {
        console.error("Error handling call accepted:", error);
      }
    },
    [setRemoteAnswer]
  );

  const getUserMediaStream = useCallback(async () => {
    try {
      console.log("Requesting camera and microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Local Stream obtained:", stream);
      setMyStream(stream);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error("Media Error:", error);
      alert("Please allow camera and microphone access");
    }
  }, []);

  const joinRoom = useCallback(() => {
    if (!userEmail || !roomId) {
      console.error("Email and Room ID are required");
      return;
    }

    if (isJoining || hasJoinedRef.current) {
      console.log("Already joining or joined");
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
    }, 1000);
  }, [socket, userEmail, roomId, isJoining]);

  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
      console.log("Local stream attached to video element");
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("Remote stream attached to video element");
      
      remoteStream.getTracks().forEach(track => {
        console.log("Remote video track:", track.kind, track.enabled);
      });
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
  }, []);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const roomIdFromUrl = pathParts[pathParts.length - 1];
    const emailFromStorage = localStorage.getItem("userEmail") || "user@example.com";

    setRoomId(roomIdFromUrl);
    setUserEmail(emailFromStorage);

    if (roomIdFromUrl && emailFromStorage && myStream && !hasJoinedRef.current) {
      setTimeout(() => {
        console.log("Auto joining room...");
        socket.emit("join-room", {
          emailId: emailFromStorage,
          roomId: roomIdFromUrl,
        });
        hasJoinedRef.current = true;
      }, 1000);
    }
  }, [socket, myStream]);

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
        <p className="text-gray-600">
          Remote User: <span className="font-bold">{remoteUserEmail || "Waiting..."}</span>
        </p>
        <p className="text-gray-600">
          Status: <span className={`font-bold ${isConnected ? "text-green-500" : "text-yellow-500"}`}>
            {isConnected ? "Connected ✅" : "Waiting for connection..."}
          </span>
        </p>
        <button
          onClick={joinRoom}
          disabled={isJoining || hasJoinedRef.current}
          className={`mt-2 px-4 py-2 text-white rounded hover:bg-blue-600 ${
            isJoining || hasJoinedRef.current 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-500"
          }`}
        >
          {isJoining ? "Joining..." : hasJoinedRef.current ? "Joined ✅" : "Manually Join Room"}
        </button>
      </div>

      <div className="flex flex-wrap gap-8">
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