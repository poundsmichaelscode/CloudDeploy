

const errorHandler = require("../middleware/errorHandler");

const {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} = require("../helper/customErrors");

const execute = (error) => {
  const req = {
    id: "test-request-id",
    headers: {},
  };

  const res = {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  const next = vi.fn();

  errorHandler(error, req, res, next);

  return { res, next };
};

describe("Centralized error handling", () => {
  it.each([
    [new UnauthorizedError(), 401],
    [new ForbiddenError("article"), 403],
    [new NotFoundError("Article"), 404],
    [new ValidationError("Invalid input"), 422],
  ])("returns the expected HTTP status", (error, status) => {
    const { res } = execute(error);

    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({
      errors: { body: [error.message] },
    });
  });

  it("hides unexpected internal error details", () => {
    const spy = vi.spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      const { res } = execute(
        new Error("Sensitive database connection details")
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errors: { body: ["Internal server error"] },
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("delegates errors after headers are sent", () => {
    const error = new Error("Connection closed");
    const req = { headers: {} };
    const res = { headersSent: true };
    const next = vi.fn();

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
