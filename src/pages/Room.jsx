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
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const isCallingRef = useRef(false);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    const handleIceCandidate = ({ candidate }) => {
      console.log("📡 Received ICE candidate from peer:", candidate);
      handleRemoteIceCandidate(candidate);
    };

    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, handleRemoteIceCandidate]);

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log("👤 New User Joined:", emailId);
      
      if (isCallingRef.current) {
        console.log("⏭️ Already calling, skipping...");
        return;
      }

      try {
        isCallingRef.current = true;
        setRemoteUserEmail(emailId);
        setTargetEmail(emailId);
        setConnectionStatus("Connecting...");

        if (!myStream) {
          console.log("⏳ Waiting for local stream...");
          return;
        }

        console.log("📞 Creating offer for:", emailId);
        const offer = await createOffer();
        
        console.log("📤 Sending offer to:", emailId);
        socket.emit("call-user", {
          emailId,
          offer,
        });
        
        await sendStream(myStream);
        console.log("✅ Stream sent to:", emailId);
        
      } catch (error) {
        console.error("❌ Error creating offer:", error);
        isCallingRef.current = false;
        setConnectionStatus("Failed");
      }
    },
    [createOffer, socket, myStream, sendStream, setTargetEmail]
  )
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("📞 Incoming Call From:", from);

      try {
        setRemoteUserEmail(from);
        setTargetEmail(from);
        setConnectionStatus("Connecting...");

        console.log("📝 Creating answer for:", from);
        const ans = await createAnswer(offer);
        
        console.log("📤 Sending answer to:", from);
        socket.emit("call-accepted", {
          emailId: from,
          ans,
        });
        
        if (myStream) {
          await sendStream(myStream);
          console.log("✅ Stream sent to:", from);
        }
        
      } catch (error) {
        console.error("❌ Error handling incoming call:", error);
        setConnectionStatus("Failed");
      }
    },
    [createAnswer, socket, myStream, sendStream, setTargetEmail]
  );
  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      console.log("✅ Call Accepted");
      
      try {
        await setRemoteAnswer(ans);
        console.log("✅ Remote answer set");
        setIsConnected(true);
        setConnectionStatus("Connected");

        if (remoteStream) {
          console.log("🎥 Remote stream already available");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        }
      } catch (error) {
        console.error("❌ Error handling call accepted:", error);
        setConnectionStatus("Failed");
      }
    },
    [setRemoteAnswer, remoteStream]
  );


  const getUserMediaStream = useCallback(async () => {
    try {
      console.log("🎥 Requesting camera and microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("✅ Local Stream obtained:", stream);
      setMyStream(stream);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        console.log("📺 Local stream attached to video element");
      }
      
      return stream;
    } catch (error) {
      console.error("❌ Media Error:", error);
      alert("Please allow camera and microphone access");
      setConnectionStatus("No Camera Access");
    }
  }, []);

  const joinRoom = useCallback(() => {
    if (!userEmail || !roomId) {
      console.error("❌ Email and Room ID are required");
      return;
    }

    if (isJoining || hasJoinedRef.current) {
      console.log("⏭️ Already joining or joined");
      return;
    }

    setIsJoining(true);
    hasJoinedRef.current = true;
    setConnectionStatus("Joining...");

    console.log(`🚪 Joining room ${roomId} as ${userEmail}`);
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
      console.log("📺 Local stream attached to video element");
    }
  }, [myStream]);


  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("📺 Remote stream attached to video element");
      remoteVideoRef.current.srcObject = remoteStream;
      setConnectionStatus("Connected ✅");
      
      remoteStream.getTracks().forEach(track => {
        console.log(`📹 Remote track: ${track.kind}, enabled: ${track.enabled}`);
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
    
    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [getUserMediaStream]);

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const roomIdFromUrl = pathParts[pathParts.length - 1];
    const emailFromStorage = localStorage.getItem("userEmail") || "user@example.com";

    setRoomId(roomIdFromUrl);
    setUserEmail(emailFromStorage);

    if (roomIdFromUrl && emailFromStorage && myStream && !hasJoinedRef.current) {
      setTimeout(() => {
        console.log("🚪 Auto joining room...");
        socket.emit("join-room", {
          emailId: emailFromStorage,
          roomId: roomIdFromUrl,
        });
        hasJoinedRef.current = true;
        setConnectionStatus("Joining...");
      }, 2000);
    }
  }, [socket, myStream]);

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("Connected ✅");
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        🎥 Video Chat Room
      </h1>

      <div className="mb-6 p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Room ID</p>
            <p className="font-bold text-lg">{roomId || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Your Email</p>
            <p className="font-bold text-lg">{userEmail || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remote User</p>
            <p className="font-bold text-lg">{remoteUserEmail || "Waiting..."}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`font-bold text-lg ${
              connectionStatus === "Connected ✅" ? "text-green-500" :
              connectionStatus === "Connecting..." ? "text-yellow-500" :
              connectionStatus === "Failed" ? "text-red-500" :
              "text-gray-500"
            }`}>
              {connectionStatus}
            </p>
          </div>
        </div>
        
        <button
          onClick={joinRoom}
          disabled={isJoining || hasJoinedRef.current}
          className={`mt-4 w-full py-3 px-4 text-white font-semibold rounded-lg transition-all ${
            isJoining || hasJoinedRef.current 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isJoining ? "⏳ Joining..." : hasJoinedRef.current ? "✅ Joined Room" : "🚪 Join Room"}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
        {/* My Video */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-800 px-4 py-2">
            <h2 className="text-white font-semibold">📹 My Video</h2>
          </div>
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-[500px] h-[350px] bg-black object-cover"
          />
        </div>

        {/* Remote Video */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-800 px-4 py-2">
            <h2 className="text-white font-semibold">👤 Remote Video</h2>
          </div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[500px] h-[350px] bg-black object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <p className="text-white text-lg">Waiting for remote video...</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-8 max-w-4xl mx-auto bg-gray-900 rounded-xl p-4">
        <details>
          <summary className="text-white cursor-pointer font-semibold">
            🔧 Debug Info
          </summary>
          <div className="mt-2 text-gray-300 text-sm font-mono">
            <p>Local Stream: {myStream ? "✅ Available" : "❌ Not available"}</p>
            <p>Remote Stream: {remoteStream ? "✅ Available" : "❌ Not available"}</p>
            <p>Connection Status: {connectionStatus}</p>
            <p>Room ID: {roomId}</p>
            <p>User Email: {userEmail}</p>
            <p>Remote User: {remoteUserEmail || "None"}</p>
            <p>Has Joined: {hasJoinedRef.current ? "✅" : "❌"}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default RoomPage;