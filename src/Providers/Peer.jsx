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
  const [isStreamSent, setIsStreamSent] = useState(false);
  const streamSentRef = useRef(false);

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (ans) => {
    await peer.setRemoteDescription(new RTCSessionDescription(ans));
  };

  const sendStream = async (stream) => {

    if (streamSentRef.current) {
      console.log('Stream already sent, skipping...');
      return;
    }

    try {
      const tracks = stream.getTracks();
      
      const existingSenders = peer.getSenders();
      const existingTrackIds = existingSenders.map(s => s.track?.id);
      
      for (const track of tracks) {

        if (!existingTrackIds.includes(track.id)) {
          peer.addTrack(track, stream);
          console.log('Added track:', track.kind);
        } else {
          console.log('Track already exists:', track.kind);
        }
      }
      
      streamSentRef.current = true;
      setIsStreamSent(true);
    } catch (error) {
      console.error('Error adding tracks:', error);
    }
  };

  const resetStreamState = () => {
    streamSentRef.current = false;
    setIsStreamSent(false);
  };

  const handleTrackEvent = useCallback((ev) => {
    const streams = ev.streams;
    console.log("Remote Stream Received");
    setRemoteStream(streams[0]);
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);

    peer.addEventListener("connectionstatechange", () => {
      console.log("Connection State:", peer.connectionState);
      
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        resetStreamState();
      }
    });

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [peer, handleTrackEvent]);

  useEffect(() => {
    return () => {
      peer.close();
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
        resetStreamState,
        isStreamSent,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};