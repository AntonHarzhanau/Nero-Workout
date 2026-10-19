export type DeleteUserState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };
