import { json } from '@remix-run/node';
import {
  Form,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
  useParams,
  useSearchParams,
  useSubmit,
} from '@remix-run/react';
import { clsx } from 'clsx';

import { SearchInput } from '~/components/forms';
import { H1 } from '~/components/headings';
import { ListLinkItem } from '~/components/links';
import { db } from '~/modules/db.server';

export async function loader() {
  const expenses = await db.expense.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  return json(expenses);
}

export default function Component() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const expenses = useLoaderData<typeof loader>();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || ' ';
  return (
    <div className="w-full">
      <H1>Your expenses</H1>
      <div className="mt-10 w-full flex flex-col-reverse lg:flex-row">
        <section className="lg:p-8 w-full lg:max-w-2xl">
          <h2 className="sr-only">All expenses</h2>
          <Form method="GET" action={location.pathname}>
            <SearchInput
              name="q"
              type="search"
              label="Search by title"
              defaultValue={searchQuery}
              onChange={(e) => submit(e.target.form)}
            />
          </Form>
          <ul className="flex flex-col">
            {expenses.map((expense) => (
              <ListLinkItem
                key={expense.id}
                to={`/dashboard/expenses/${expense.id}`}
                isActive={expense.id === id}
                deleteProps={{
                  ariaLabel: `Delete expense ${expense.title}`,
                  action: `/dashboard/expenses/${expense.id}`,
                }}
              >
                <p>
                  <i>{new Date(expense.createdAt).toLocaleDateString('en-US')}</i>
                </p>
                <p className="text-xl font-semibold">{expense.title}</p>
                <p>
                  <b>
                    {Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currencyCode }).format(
                      expense.amount,
                    )}
                  </b>
                </p>
              </ListLinkItem>
            ))}
          </ul>
        </section>
        <section className={clsx('lg:p-8 w-full', navigation.state === 'loading' && 'motion-safe:animate-pulse')}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}