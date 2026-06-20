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
  const targetEmailRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const createPeerConnection = useCallback(() => {
    // Close existing connection if any
    if (peerRef.current) {
      peerRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
        // Free TURN servers for NAT traversal in production
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
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
        console.log("📺 Setting remote stream:", stream.id, "tracks:", stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
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
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE Connection State:", pc.iceConnectionState);
    };

    pc.onnegotiationneeded = () => {
      console.log("🔄 Negotiation needed");
    };

    peerRef.current = pc;

    // Process any pending ICE candidates
    if (pendingCandidatesRef.current.length > 0) {
      console.log(`📥 Processing ${pendingCandidatesRef.current.length} pending ICE candidates`);
      pendingCandidatesRef.current.forEach(async (candidate) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("❌ Error adding pending ICE candidate:", e);
        }
      });
      pendingCandidatesRef.current = [];
    }

    return pc;
  }, [socket]);

  const getOrCreatePeerConnection = useCallback(() => {
    if (peerRef.current && peerRef.current.connectionState !== "closed") {
      return peerRef.current;
    }
    return createPeerConnection();
  }, [createPeerConnection]);

  const handleRemoteIceCandidate = useCallback(
    async (candidate) => {
      try {
        const pc = peerRef.current;
        if (!pc || !pc.remoteDescription) {
          console.log("📦 Queuing ICE candidate (no remote description yet)");
          pendingCandidatesRef.current.push(candidate);
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

  const sendStream = useCallback(async (stream) => {
    if (!stream) {
      console.error("❌ No stream to send");
      return;
    }

    try {
      const pc = getOrCreatePeerConnection();

      console.log("📤 Sending stream with tracks:", stream.getTracks().map(t => t.kind));
      
      // Get existing senders
      const existingSenders = pc.getSenders();
      const tracks = stream.getTracks();

      for (const track of tracks) {
        // Check if we already have a sender for this track kind
        const existingSender = existingSenders.find(s => s.track && s.track.kind === track.kind);
        if (existingSender) {
          console.log("🔄 Replacing existing track:", track.kind);
          await existingSender.replaceTrack(track);
        } else {
          console.log("➕ Adding new track:", track.kind);
          pc.addTrack(track, stream);
        }
      }

      console.log("✅ All tracks added/updated successfully");
    } catch (error) {
      console.error("❌ Error adding tracks:", error);
      throw error;
    }
  }, [getOrCreatePeerConnection]);

  const createOffer = useCallback(async () => {
    try {
      const pc = getOrCreatePeerConnection();
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log("📝 Offer created and local description set");
      return offer;
    } catch (error) {
      console.error("❌ Error creating offer:", error);
      throw error;
    }
  }, [getOrCreatePeerConnection]);

  const createAnswer = useCallback(async (offer) => {
    try {
      const pc = getOrCreatePeerConnection();
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("✅ Remote description (offer) set");

      // Process any pending ICE candidates now that remote description is set
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`📥 Processing ${pendingCandidatesRef.current.length} pending ICE candidates after setting remote description`);
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("❌ Error adding pending ICE candidate:", e);
          }
        }
        pendingCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);
      console.log("📝 Answer created and local description set");
      return answer;
    } catch (error) {
      console.error("❌ Error creating answer:", error);
      throw error;
    }
  }, [getOrCreatePeerConnection]);

  const setRemoteAnswer = useCallback(async (ans) => {
    try {
      const pc = peerRef.current;
      if (!pc) {
        console.log("❌ No peer connection available");
        return;
      }

      if (pc.signalingState === "stable") {
        console.log("⏭️ Signaling state is already stable, skipping setRemoteDescription");
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("✅ Remote answer set");

      // Process any pending ICE candidates now that remote description is set
      if (pendingCandidatesRef.current.length > 0) {
        console.log(`📥 Processing ${pendingCandidatesRef.current.length} pending ICE candidates after setting remote answer`);
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("❌ Error adding pending ICE candidate:", e);
          }
        }
        pendingCandidatesRef.current = [];
      }
    } catch (error) {
      console.error("❌ Error setting remote answer:", error);
      throw error;
    }
  }, []);

  const setTargetEmail = useCallback((email) => {
    targetEmailRef.current = email;
    console.log("🎯 Target email set to:", email);
  }, []);

  // Initialize peer connection on mount
  useEffect(() => {
    if (!peerRef.current) {
      createPeerConnection();
    }
  }, [createPeerConnection]);

  // ICE candidate handler - ONLY here, not in Room.jsx
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

  // Cleanup on unmount
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