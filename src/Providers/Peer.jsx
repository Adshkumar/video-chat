import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useSocket } from "./Socket";

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const { socket } = useSocket();
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const streamSentRef = useRef(false);
  const targetEmailRef = useRef(null);
  const peerRef = useRef(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && targetEmailRef.current && socket) {
        console.log("📡 Sending ICE candidate to:", targetEmailRef.current);
        socket.emit("ice-candidate", {
          emailId: targetEmailRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("🎥 Remote track received!", event.streams);
      if (event.streams && event.streams.length > 0) {
        const stream = event.streams[0];
        console.log("📺 Setting remote stream:", stream);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection State:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("✅ Peer connection established!");
      }
      if (pc.connectionState === "failed") {
        console.log("❌ Peer connection failed");
        streamSentRef.current = false;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE Connection State:", pc.iceConnectionState);
    };

    peerRef.current = pc;
    setPeerConnection(pc);
    return pc;
  }, [socket]);

  const handleRemoteIceCandidate = useCallback(
    async (candidate) => {
      try {
        const pc = peerRef.current;
        if (!pc) {
          console.log("❌ No peer connection available");
          return;
        }
        console.log("📥 Adding remote ICE candidate");
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ ICE candidate added successfully");
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    },
    []
  );

  const createOffer = useCallback(async () => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.log("❌ No peer connection available, creating one");
        createPeerConnection();
      }
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log("📝 Offer created");
      return offer;
    } catch (error) {
      console.error("❌ Error creating offer:", error);
      throw error;
    }
  }, [createPeerConnection]);

  const createAnswer = useCallback(async (offer) => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.log("❌ No peer connection available, creating one");
        createPeerConnection();
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);
      console.log("📝 Answer created");
      return answer;
    } catch (error) {
      console.error("❌ Error creating answer:", error);
      throw error;
    }
  }, [createPeerConnection]);

  const setRemoteAnswer = useCallback(async (ans) => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.log("❌ No peer connection available");
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("✅ Remote answer set");
    } catch (error) {
      console.error("❌ Error setting remote answer:", error);
      throw error;
    }
  }, []);

  const sendStream = useCallback(async (stream) => {
    if (!stream) {
      console.error("❌ No stream to send");
      return;
    }

    if (streamSentRef.current) {
      console.log("⏭️ Stream already sent, skipping...");
      return;
    }

    try {
      const pc = peerRef.current;
      if (!pc) {
        console.log("❌ No peer connection available, creating one");
        createPeerConnection();
      }

      console.log("📤 Sending stream with tracks:", stream.getTracks().map(t => t.kind));
      
      const senders = pc.getSenders();
      for (const sender of senders) {
        if (sender.track) {
          pc.removeTrack(sender);
          console.log("🗑️ Removed existing sender:", sender.track.kind);
        }
      }

      const tracks = stream.getTracks();
      for (const track of tracks) {
        pc.addTrack(track, stream);
        console.log("✅ Added track:", track.kind);
      }

      streamSentRef.current = true;
      console.log("✅ All tracks added successfully");
    } catch (error) {
      console.error("❌ Error adding tracks:", error);
      throw error;
    }
  }, [createPeerConnection]);

  const setTargetEmail = useCallback((email) => {
    targetEmailRef.current = email;
    console.log("🎯 Target email set to:", email);
  }, []);

  useEffect(() => {
    if (!peerRef.current) {
      createPeerConnection();
    }
  }, [createPeerConnection]);

  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = ({ candidate }) => {
      console.log("📡 Received ICE candidate from peer");
      handleRemoteIceCandidate(candidate);
    };

    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [socket, handleRemoteIceCandidate]);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        console.log("🔒 Peer connection closed");
      }
    };
  }, []);

  return (
    <PeerContext.Provider
      value={{
        peer: peerRef.current,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
        handleRemoteIceCandidate,
        setTargetEmail,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};