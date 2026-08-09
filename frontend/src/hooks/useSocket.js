import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

export function useSocket() {
  const context = useContext(SocketContext);
  return context ? context.current : null;
}