Next.js v13.5+

Older Next.js versions
Add the following component to your main app file:

Next.js (/app)

Next.js (/app)
TypeScript

TypeScript
import { SpeedInsights } from '@vercel/speed-insights/next';
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
