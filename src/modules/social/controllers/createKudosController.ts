import type { Request, Response } from "express";

type KudosEntity = "post" | "activity";
type KudosAction = "add" | "remove" | "users";

type KudosService = (
  id: string,
  userId: string,
) => Promise<unknown>;

export const createKudosController = (
  entity: KudosEntity,
  action: KudosAction,
  service: KudosService,
) => {
  return async (req: Request, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const id = req.params[entity + "Id"];

      if (typeof id !== "string") {
        return res.status(400).json({
          message:
            (entity === "post" ? "Post" : "Activity") +
            " ID is required",
        });
      }

      const result = await service(id, userId);

      if (action === "users" && Array.isArray(result)) {
        return res.status(200).json({
          count: result.length,
          users: result,
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      const label =
        action === "add"
          ? "Add"
          : action === "remove"
            ? "Remove"
            : "Get";

      const suffix =
        action === "users" ? "kudos users" : "kudos";

      console.error(
        label + " " + entity + " " + suffix + " error:",
        error,
      );

      if (error instanceof Error) {
        const notFound =
          (entity === "post" ? "Post" : "Activity") +
          " not found";

        if (error.message === notFound) {
          return res.status(404).json({
            message: error.message,
          });
        }

        if (
          action === "add" &&
          error.message ===
            "You cannot give kudos to your own " + entity
        ) {
          return res.status(400).json({
            message: error.message,
          });
        }

        if (action === "add") {
          return res.status(500).json({
            message: error.message,
          });
        }
      }

      const fallback =
        action === "add"
          ? "Failed to add kudos"
          : action === "remove"
            ? "Failed to remove kudos"
            : "Failed to get kudos users";

      return res.status(500).json({
        message: fallback,
      });
    }
  };
};
