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
