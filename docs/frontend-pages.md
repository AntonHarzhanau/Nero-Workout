# Frontend pages

Exercises establish the pattern for future plan and workout pages:

- `/exercises` lists and filters records using URL parameters.
- `/exercises/[id]` fetches the current record on the server. The owner's Edit button switches the page to a form; Cancel unmounts the draft without an API call, and Save revalidates the detail and list.
- Creating an exercise uses a dialog with the same fields and form hook, then opens the newly created detail page.
- The backend owns authorization. Hiding controls in the browser is only presentation.

## Shared components already in use

- `PageHeader`: title, description, optional back link and actions; used by exercises, profile and users.
- `EmptyState`: shadcn Empty with an icon and actions; used for an empty catalog and missing detail.
- `FormDialog`, `FormActions`, `InputField`, `TextareaField`: shadcn controls for future creation dialogs and page editors. `InputField` also serves login and registration.
- `DeleteConfirmationDialog`: shared confirmation form for exercises, accounts and users; mutations and result handling stay in their features.
- `ListPagination` and `paginationMetaSchema`: common paginated API metadata and navigation.
- `useActionForm`: generic React Hook Form submission and field error handling, located under `src/hooks`.
- `requireSession`: server page authentication context, also reused by the administrator guard.

## Reuse identified in the legacy design

`nero-nextjs/components/nero-app.tsx` repeats headings, empty states, summary cards, filters and destructive confirmations. These use the shared components above, plus the existing shadcn Card, Badge and Button.

`nero-nextjs/components/training-editor.tsx` shares an exercise picker, ordered exercise rows, sets (weight/repetitions) and notes between plans and workouts. Extract these when implementing those features, using the server's current exercise catalog and IDs. The old localStorage store and its combined editor are visual references only.

Keep plan/workout queries and mutations in their respective features. They can reuse page/form primitives without a generic entity editor or coupling their business rules to exercises. Workout dates, duration and optional source plan remain workout-specific. Plan and workout detail routes should follow `/plans/[id]` and `/workouts/[id]`.

## Plans

`/plans` now renders the API summaries; `/plans/[id]` reads the complete current plan. Creating a plan uses a dialog, editing uses an in-page draft, and cancelling discards all unsaved exercise/set changes. Full saves use PUT; adding or removing an exercise from the saved view uses the incremental POST/DELETE endpoints. Deleting a plan leaves catalog exercises and existing workouts intact.

Plan summaries do not contain exercises, counts or volume. Cards therefore show their actual title, description and update date, without issuing a detail request for every card. Counts, series and volume are calculated from the full detail response.

Shared `features/training` components cover ordered exercise drafts, nested sets, numeric validation, read-only set tables and volume summaries. They accept the exercise limit of the owning feature (200 for plans, 100 for future workouts). Backend payloads contain exercise IDs and sets; display titles in the browser draft are excluded from writes.

`ExercisePicker` reuses the existing exercise creation dialog and reads the paginated catalog through `/api/exercises`. This authenticated GET handler forwards the HttpOnly token on the server. Searches wait 300 ms and abort obsolete requests. A generic `useApiMutation` handles incremental mutation progress/errors, and HTTP mutation error formatting is shared with exercises.
