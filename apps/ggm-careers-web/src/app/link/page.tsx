import { redirect } from 'next/navigation';

export default function LinkRedirectPage() {
  // Redirect /link directly to the unified Applicant Portal at /applicant
  redirect('/applicant');
}