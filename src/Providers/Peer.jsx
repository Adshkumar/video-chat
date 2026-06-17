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
  const [localStream, setLocalStream] = useState(null);
  const streamSentRef = useRef(false);
  const peerRef = useRef(null);

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

  useEffect(() => {
    const handleIceCandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate gathered');
      }
    };

    peer.addEventListener('icecandidate', handleIceCandidate);
    
    return () => {
      peer.removeEventListener('icecandidate', handleIceCandidate);
    };
  }, [peer]);

  const createOffer = async () => {
    try {
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peer.setLocalDescription(offer);
      console.log('Offer created:', offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
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
      console.log('Answer created:', answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  };

  const setRemoteAnswer = async (ans) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(ans));
      console.log('Remote answer set');
    } catch (error) {
      console.error('Error setting remote answer:', error);
      throw error;
    }
  };

  const sendStream = async (stream) => {
    if (!stream) {
      console.error('No stream to send');
      return;
    }

    if (streamSentRef.current) {
      console.log('Stream already sent, skipping...');
      return;
    }

    try {
      console.log('Sending stream with tracks:', stream.getTracks().map(t => t.kind));
      
      const senders = peer.getSenders();
      for (const sender of senders) {
        if (sender.track) {
          peer.removeTrack(sender);
          console.log('Removed existing sender:', sender.track.kind);
        }
      }

      const tracks = stream.getTracks();
      for (const track of tracks) {
        peer.addTrack(track, stream);
        console.log('Added track:', track.kind);
      }

      streamSentRef.current = true;
      setLocalStream(stream);
      
      console.log('All tracks added successfully');
    } catch (error) {
      console.error('Error adding tracks:', error);
      throw error;
    }
  };

  const handleTrackEvent = useCallback((ev) => {
    const streams = ev.streams;
    console.log("Remote Stream Received:", streams);
    
    if (streams && streams.length > 0) {
      const remoteStream = streams[0];
      setRemoteStream(remoteStream);
      
      remoteStream.getTracks().forEach(track => {
        console.log('Remote track:', track.kind, track.enabled);
      });
    }
  }, []);

  const handleConnectionStateChange = useCallback(() => {
    console.log("Connection State:", peer.connectionState);
    
    if (peer.connectionState === 'connected') {
      console.log('Peer connection established!');
    }
    
    if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
      streamSentRef.current = false;
    }
  }, [peer]);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);
    peer.addEventListener("connectionstatechange", handleConnectionStateChange);

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
      peer.removeEventListener("connectionstatechange", handleConnectionStateChange);
    };
  }, [peer, handleTrackEvent, handleConnectionStateChange]);

  useEffect(() => {
    return () => {
      if (peer) {
        peer.close();
      }
    };
  }, [peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
        localStream,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};