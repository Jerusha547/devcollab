import { useEffect, useRef } from "react";

const useWebSocket = (username: string, onMessage: (data: any) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!username) return;

    ws.current = new WebSocket(
      process.env.REACT_APP_WS_URL || "ws://localhost:5000",
    );

    ws.current.onopen = () => {
      ws.current?.send(
        JSON.stringify({
          type: "register",
          username,
          token: localStorage.getItem("token"),
        }),
      );
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageRef.current(data);
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
