/**
 * Console Home Page
 * Staff dashboard for managing organizations
 */

import { getUser } from '@/lib/auth/getUser';
import { ConsoleDashboard } from './ConsoleDashboard';

export default async function ConsolePage() {
  const user = await getUser();

  return <ConsoleDashboard userEmail={user?.email || 'admin@themison.com'} />;
}
