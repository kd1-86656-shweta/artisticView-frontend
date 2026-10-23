import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateCommunityMutation } from '@/store/communityApi';
import { toApiError } from '@/utils/errors';
import CommunityForm from './CommunityForm';

export default function CreateCommunityPage() {
  const navigate = useNavigate();
  const [create, { isLoading }] = useCreateCommunityMutation();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <Link to="/communities" className="small text-body-secondary"><i className="bi bi-arrow-left me-1" />Communities</Link>
        <h1 className="display-6 page-title mt-2 mb-1">Create a community</h1>
        <p className="text-body-secondary mb-4">You'll be its owner. Add members, pick moderators and post right away.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <CommunityForm saving={isLoading} submitLabel="Create community" onSubmit={async (body) => {
          setError(null);
          try {
            const c = await create(body).unwrap();
            navigate(`/c/${c.slug}`, { replace: true });
          } catch (err) {
            setError(toApiError(err as never)?.message ?? 'Could not create the community');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }} />
      </div>
    </div>
  );
}
