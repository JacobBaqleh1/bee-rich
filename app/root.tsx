import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from '@remix-run/react';

import { H1 } from './components/headings';
import { ButtonLink } from './components/links';
import { PageTransitionProgressBar } from './components/progress';
import { getUser } from './modules/session/session.server';
import tailwindCSS from './styles/tailwind.css';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

export function ErrorBoundary() {
  const error = useRouteError();
  let heading = 'Unexpected Error';
  let message = 'We are very sorry. An error has occured';
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 401:
        heading = '401 Unarthorized';
        message = 'Looks like you are trying to visit a page you do not have access too';
        break;
      case 404:
        heading = '404 Not Found';
        message = 'Oops! Looks like you tried to visit a page that does not exist';
        break;
    }
  }
  let errorMessage = error instanceof Error ? error.message : null;
  return (
    <Document>
      <section className="m-5 lg:m-20 flex flex-col gap-5">
        <H1> {heading}</H1>
        <p>{message}</p>
        {errorMessage && (
          <div className="border-4 border-red-500 p-10">
            <p>Error message: {errorMessage}</p>
          </div>
        )}
        <ButtonLink to="/" isPrimary>
          Back to homepage
        </ButtonLink>
      </section>
    </Document>
  );
}

export const meta: MetaFunction = () => {
  return [{ title: 'BeeRich' }];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindCSS },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    href: 'https://fonts.googleapis.com/css2?family=Ubuntu&display=swap',
    rel: 'stylesheet',
  },
];

export default function Component() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background dark:bg-darkBackground text-lg text-text dark:text-darkText">
        <PageTransitionProgressBar />
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
