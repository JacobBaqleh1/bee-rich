import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect, unstable_parseMultipartFormData } from '@remix-run/node';
import {
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useParams,
  useRouteError,
} from '@remix-run/react';

import { Button } from '~/components/buttons';
import { Attachment, Form, Input, Textarea } from '~/components/forms';
import { H2 } from '~/components/headings';
import { FloatingActionLink } from '~/components/links';
import { uploadHandler } from '~/modules/attachments.server';
import { db } from '~/modules/db.server';
import { requireUserId } from '~/modules/session/session.server';

export function ErrorBoundary() {
  const error = useRouteError();
  const { id } = useParams();
  let heading = 'Something went wrong';
  let message = 'Apologies, something went wrong in our end, please try agian';
  if (isRouteErrorResponse(error) && error.status === 404) {
    heading = 'expense not found';
    message = `Apologies, the expense with the id ${id} cannot be found`;
  }
  return (
    <>
      <div className="w-full m-auto lg:max-w-3xl flex flex-col items-center justify-center gap-5">
        <H2>{heading}</H2>
        <p>{message}</p>
      </div>{' '}
      <FloatingActionLink to="/dashboard/expenses/">Add</FloatingActionLink>
    </>
  );
}

async function deleteExpense(request: Request, id: string, userId: string): Promise<Response> {
  const referer = request.headers.get('referer');
  const redirectPath = referer || 'dashboard/expenses';

  try {
    await db.expense.delete({ where: { id_userId: { id, userId } } });
  } catch (err) {
    throw new Response('Not Found', { status: 404 });
  }

  if (redirectPath.includes(id)) {
    return redirect('/dashboard/expenses');
  }
  return redirect(redirectPath);
}

async function updateExpense(formData: FormData, id: string, userId: string): Promise<Response> {
  const title = formData.get('title');
  const description = formData.get('description');
  const amount = formData.get('amount');
  if (typeof title !== 'string' || typeof description !== 'string' || typeof amount !== 'string') {
    throw Error('something went wrong');
  }
  const amountNumber = Number.parseFloat(amount);
  if (Number.isNaN(amountNumber)) {
    throw Error('something went wrong');
  }
  await db.expense.update({
    where: { id_userId: { id, userId } },
    data: { title, description, amount: amountNumber },
  });
  return json({ success: true });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');

  let formData: FormData;

  const contentType = request.headers.get('content-type');
  if (contentType?.toLowerCase().includes('multipart/form')) {
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } else {
    formData = await request.formData();
  }
  const intent = formData.get('intent');
  if (intent === 'delete') {
    return deleteExpense(request, id, userId);
  }
  if (intent == 'update') {
    return updateExpense(formData, id, userId);
  }
  throw new Response('Bad request', { status: 400 });
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const { id } = params;
  if (!id) throw Error('id route parameter must be defined');
  const expense = await db.expense.findUnique({ where: { id_userId: { id, userId } } });
  if (!expense) throw new Response('Not found', { status: 404 });
  return json(expense);
}
export default function Component() {
  const expense = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle' && navigation.formAction === `/dashboard/expenses/${expense.id}`;
  const actionData = useActionData<typeof action>();
  return (
    <>
      <section className="w-full h-full p-8">
        <H2>{expense.title}</H2>
        <p>${expense.amount}</p>
      </section>
      <FloatingActionLink to="/dashboard/expenses">Add expense</FloatingActionLink>
      <Form
        method="POST"
        action={`/dashboard/expenses/${expense.id}?index`}
        key={expense.id}
        encType="multipart/form-data"
      >
        <Input
          label="Title:"
          type="text"
          name="title"
          placeholder="Dinner for Two"
          defaultValue={expense.title}
          required
        />
        <Textarea label="Description:" name="description" defaultValue={expense.description || ' '} />
        <Input label="Amount (in USD):" type="number" defaultValue={expense.amount} name="amount" required />
        {expense.attachment ? (
          <Attachment
            label="Current Attachment"
            attachmentUrl={`/dashboard/expenses/${expense.id}/attachments/${expense.attachment}`}
          />
        ) : (
          <Input label="New Attacchment" type="file" name="attachment" />
        )}
        <Button type="submit" name="intent" value="update" disabled={isSubmitting} isPrimary>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
        <p aria-live="polite" className="text-green-600">
          {actionData?.success && 'Changes saved!'}
        </p>
      </Form>
    </>
  );
}
