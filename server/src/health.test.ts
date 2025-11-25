import request from "supertest";
import app from "./index";

describe("GET /health", () => {
  it("responds with ok status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
