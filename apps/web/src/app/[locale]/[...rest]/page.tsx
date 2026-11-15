import { notFound } from 'next/navigation';

/** Unknown paths under a locale render the localised 404 page. */
export default function CatchAll() {
  notFound();
}
