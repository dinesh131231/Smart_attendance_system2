import { WebSocketServer } from "ws";

let wss = null;

export const initSocketServer = (server) => {
    if (wss) return wss;

    wss = new WebSocketServer({ server });

    wss.on("connection", (socket) => {
        socket.send(
            JSON.stringify({
                type: "status",
                payload: { connected: true },
            })
        );

        socket.on("close", () => {
            // no-op: clients disconnect naturally
        });
    });

    return wss;
};

export const broadcastAttendanceEvent = (payload) => {
    if (!wss) return;

    const message = JSON.stringify({
        type: "attendance-marked",
        payload,
    });

    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
};
