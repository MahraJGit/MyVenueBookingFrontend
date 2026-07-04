export type AuthBroadcastMessage = { type: "logout" } | { type: "login" };

const CHANNEL_NAME = "mvb-auth-sync";

export function postAuthBroadcast(message: AuthBroadcastMessage) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage(message);
  channel.close();
}

export function subscribeAuthBroadcast(
  handler: (message: AuthBroadcastMessage) => void,
) {
  if (typeof BroadcastChannel === "undefined") {
    return () => {};
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
    const message = event.data;
    if (message?.type === "logout" || message?.type === "login") {
      handler(message);
    }
  };

  return () => channel.close();
}
