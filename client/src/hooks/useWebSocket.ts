import { useEffect, useRef } from "react";

const useWebSocket = (username: string, onMessage: (data: any) => void) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!username) return;

    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: "register", username }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, [username]);
};

export default useWebSocket;
