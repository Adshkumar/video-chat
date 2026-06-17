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
  } = usePeer();

  const [myStream, setMyStream] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      console.log("New User Joined:", emailId);

      const offer = await createOffer();
      socket.emit("call-user", {
        emailId,
        offer,
      });
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log("Incoming Call From:", from);

      const ans = await createAnswer(offer);
      if (myStream) {
        await sendStream(myStream);
      }

      socket.emit("call-accepted", {
        emailId: from,
        ans,
      });
    },
    [createAnswer, socket, myStream, sendStream]
  );

  const handleCallAccepted = useCallback(
    async ({ ans }) => {
      console.log("Call Accepted");
      await setRemoteAnswer(ans);

      if (myStream) {
        await sendStream(myStream);
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

    console.log(`Joining room ${roomId} as ${userEmail}`);
    socket.emit("join-room", {
      emailId: userEmail,
      roomId: roomId,
    });
  }, [socket, userEmail, roomId]);

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
  }, [getUserMediaStream]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const roomIdFromUrl = pathParts[pathParts.length - 1];
    const emailFromStorage = localStorage.getItem("userEmail") || "user@example.com";

    setRoomId(roomIdFromUrl);
    setUserEmail(emailFromStorage);

    if (roomIdFromUrl && emailFromStorage) {
      setTimeout(() => {
        socket.emit("join-room", {
          emailId: emailFromStorage,
          roomId: roomIdFromUrl,
        });
      }, 500);
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
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Manually Join Room
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