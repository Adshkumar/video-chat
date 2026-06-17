// import { off } from "process";
// import React, { useMemo } from "react";

// const PeerContext = React.createContext(null);

// export const usePeer = () => React.useContext(PeerContext);

// export const PeerProvider = (props) => {
//     const Peer = useMemo(() => new RTCPeerConnection(), {
//         iceServers: [
//             {
//                 urls: [
//                     "stun:stun.l.google.com:19302",
//                     "stun:global.stun.twilio.com:3478",
//                 ],
//             },
//         ],
//     }, []);

//     const createOffer = async () =>{
//         const offer = await Peer.createOffer();
//         await Peer.setLocalDescription(offer);
//         return offer;
//     }

//     const createAnswer = async (offer) => {
//         await Peer.setRemoteDescription(offer);
//         const answer = await Peer.createAnswer();
//         await Peer.setLocalDescription(answer);
//         return answer;
//     }

//     const setRemoteAnswer = async (and) => {
//         await Peer.setRemoteDescription(ans);
//     }
//     return (
//         <PeerContext.Provider value={{Peer, createOffer, createAnswer, setRemoteAnswer }}>
//             {props.children}
//         </PeerContext.Provider>
//     )
// }



import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";

const PeerContext = React.createContext(null);

export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);

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
    const tracks = stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, stream);
    }
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
    });

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [peer, handleTrackEvent]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};