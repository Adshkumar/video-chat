import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const streamSentRef = useRef(false);
  const peerRef = useRef(null);
  const targetEmailRef = useRef(null);
  const socketRef = useRef(null);

  const { socket } = React.useContext(React.createContext(null)) || {};

  const peer = useMemo(() => {
    const newPeer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    peerRef.current = newPeer;
    return newPeer;
  }, []);

  const handleIceCandidate = useCallback(
    (event) => {
      if (event.candidate && socketRef.current && targetEmailRef.current) {
        console.log("📡 Sending ICE candidate to:", targetEmailRef.current);
        socketRef.current.emit("ice-candidate", {
          emailId: targetEmailRef.current,
          candidate: event.candidate,
        });
      }
    },
    []
  );

  const handleRemoteIceCandidate = useCallback(
    async (candidate) => {
      try {
        if (peerRef.current) {
          console.log("📥 Adding remote ICE candidate");
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (socket) {
      socketRef.current = socket;
      console.log("✅ Socket reference set in PeerProvider");
    }
  }, [socket]);

  useEffect(() => {
    const peerInstance = peerRef.current;
    if (!peerInstance) return;

    peerInstance.addEventListener("icecandidate", handleIceCandidate);

    return () => {
      peerInstance.removeEventListener("icecandidate", handleIceCandidate);
    };
  }, [peer, handleIceCandidate]);

  const createOffer = async () => {
    try {
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      console.log("📝 Offer created");
      return offer;
    } catch (error) {
      console.error("❌ Error creating offer:", error);
      throw error;
    }
  };

  const createAnswer = async (offer) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(answer);
      console.log("📝 Answer created");
      return answer;
    } catch (error) {
      console.error("❌ Error creating answer:", error);
      throw error;
    }
  };

  const setRemoteAnswer = async (ans) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("✅ Remote answer set");
    } catch (error) {
      console.error("❌ Error setting remote answer:", error);
      throw error;
    }
  };

  const sendStream = async (stream) => {
    if (!stream) {
      console.error("❌ No stream to send");
      return;
    }

    if (streamSentRef.current) {
      console.log("⏭️ Stream already sent, skipping...");
      return;
    }

    try {
      console.log("📤 Sending stream with tracks:", stream.getTracks().map(t => t.kind));
      
      const senders = peer.getSenders();
      for (const sender of senders) {
        if (sender.track) {
          peer.removeTrack(sender);
          console.log("🗑️ Removed existing sender:", sender.track.kind);
        }
      }

      const tracks = stream.getTracks();
      for (const track of tracks) {
        peer.addTrack(track, stream);
        console.log("✅ Added track:", track.kind);
      }

      streamSentRef.current = true;
      console.log("✅ All tracks added successfully");
    } catch (error) {
      console.error("❌ Error adding tracks:", error);
      throw error;
    }
  };

  const handleTrackEvent = useCallback((ev) => {
    const streams = ev.streams;
    console.log("📥 Remote Stream Received:", streams);
    
    if (streams && streams.length > 0) {
      const remoteStream = streams[0];
      setRemoteStream(remoteStream);
      
      remoteStream.getTracks().forEach(track => {
        console.log(`📹 Remote track: ${track.kind}, enabled: ${track.enabled}`);
      });
    }
  }, []);

  const handleConnectionStateChange = useCallback(() => {
    const state = peer.connectionState;
    console.log(`🔗 Connection State: ${state}`);
    
    if (state === "connected") {
      console.log("✅ Peer connection established!");
    }
    
    if (state === "failed") {
      console.log("❌ Peer connection failed");
      streamSentRef.current = false;
    }
    
    if (state === "disconnected") {
      console.log("🔌 Peer connection disconnected");
    }
  }, [peer]);

  useEffect(() => {
    const peerInstance = peerRef.current;
    if (!peerInstance) return;

    peerInstance.addEventListener("track", handleTrackEvent);
    peerInstance.addEventListener("connectionstatechange", handleConnectionStateChange);

    return () => {
      peerInstance.removeEventListener("track", handleTrackEvent);
      peerInstance.removeEventListener("connectionstatechange", handleConnectionStateChange);
    };
  }, [peer, handleTrackEvent, handleConnectionStateChange]);

  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        console.log("🔒 Peer connection closed");
      }
    };
  }, []);

  const setTargetEmail = (email) => {
    targetEmailRef.current = email;
    console.log("🎯 Target email set to:", email);
  };

  return (
    <PeerContext.Provider
      value={{
        peer,
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