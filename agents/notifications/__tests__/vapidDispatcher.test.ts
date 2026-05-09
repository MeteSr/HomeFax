/**
 * @jest-environment node
 */
// TDD — RED phase for #276 (VAPID web-push dispatcher)
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));
jest.mock("../vapidStore", () => ({
  getSubscriptionsForPrincipal: jest.fn(),
  removeSubscription: jest.fn(),
}));

import webpush from "web-push";
import { getSubscriptionsForPrincipal, removeSubscription } from "../vapidStore";
import { dispatchWebPush } from "../vapidDispatcher";

const mockSend   = webpush.sendNotification as jest.MockedFunction<typeof webpush.sendNotification>;
const mockGetSubs = getSubscriptionsForPrincipal as jest.MockedFunction<typeof getSubscriptionsForPrincipal>;
const mockRemove  = removeSubscription as jest.MockedFunction<typeof removeSubscription>;

const PRINCIPAL = "principal-vapid-abc";
const SUB = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
};
const PAYLOAD = { title: "New job match", body: "A job in your area needs HVAC service." };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("dispatchWebPush", () => {
  it("calls sendNotification for each subscription", async () => {
    mockGetSubs.mockReturnValue([SUB]);
    mockSend.mockResolvedValue({} as any);

    await dispatchWebPush(PRINCIPAL, PAYLOAD);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      SUB,
      JSON.stringify({ title: PAYLOAD.title, body: PAYLOAD.body }),
      expect.any(Object)
    );
  });

  it("fans out to multiple subscriptions for one principal", async () => {
    const SUB2 = { endpoint: "https://push2.example.com/sub", keys: { p256dh: "k2", auth: "a2" } };
    mockGetSubs.mockReturnValue([SUB, SUB2]);
    mockSend.mockResolvedValue({} as any);

    await dispatchWebPush(PRINCIPAL, PAYLOAD);

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("is a no-op when principal has no subscriptions", async () => {
    mockGetSubs.mockReturnValue([]);
    await dispatchWebPush(PRINCIPAL, PAYLOAD);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("evicts subscription on 410 Gone response", async () => {
    mockGetSubs.mockReturnValue([SUB]);
    const err = Object.assign(new Error("Gone"), { statusCode: 410 });
    mockSend.mockRejectedValue(err);

    await dispatchWebPush(PRINCIPAL, PAYLOAD);

    expect(mockRemove).toHaveBeenCalledWith(SUB.endpoint);
  });

  it("logs but does not throw on non-410 errors", async () => {
    mockGetSubs.mockReturnValue([SUB]);
    mockSend.mockRejectedValue(new Error("Network error"));

    await expect(dispatchWebPush(PRINCIPAL, PAYLOAD)).resolves.toBeUndefined();
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
