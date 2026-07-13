import { redirect } from 'next/navigation';

export default function HomeRedirect() {
  redirect('/admin/dashboard');
}
