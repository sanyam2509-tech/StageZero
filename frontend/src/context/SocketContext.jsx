import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("connect_error", () => {
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    // Listen for live organizer announcements
    socketInstance.on("announcement:broadcast", (announcement) => {
      setLatestAnnouncement(announcement);
      toast(
        (t) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-amber-300">
                {announcement.title || "Live Announcement"}
              </span>
            </div>
            <p className="text-sm text-slate-200">{announcement.message}</p>
            <span className="text-[10px] text-slate-400 mt-1">
              Broadcast by {announcement.broadcastBy?.name || "Organizer"}
            </span>
          </div>
        ),
        {
          duration: 7000,
          position: "top-right",
          style: {
            background: "#0F172A",
            color: "#F8FAFC",
            border: "1px solid #F59E0B",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.3)",
          },
        }
      );
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinEvent = useCallback(
    (eventId) => {
      if (socket && eventId) {
        socket.emit("join:event", eventId);
      }
    },
    [socket]
  );

  const leaveEvent = useCallback(
    (eventId) => {
      if (socket && eventId) {
        socket.emit("leave:event", eventId);
      }
    },
    [socket]
  );

  const joinTeam = useCallback(
    (teamId) => {
      if (socket && teamId) {
        socket.emit("join:team", teamId);
      }
    },
    [socket]
  );

  const leaveTeam = useCallback(
    (teamId) => {
      if (socket && teamId) {
        socket.emit("leave:team", teamId);
      }
    },
    [socket]
  );

  const value = {
    socket,
    isConnected,
    latestAnnouncement,
    clearAnnouncement: () => setLatestAnnouncement(null),
    joinEvent,
    leaveEvent,
    joinTeam,
    leaveTeam,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
