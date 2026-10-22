import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
      <h1 className="display-3 fw-bold">404</h1>
      <p className="text-body-secondary">We could not find that page.</p>
      <Link to="/" className="btn btn-primary">Go to the start</Link>
    </div>
  );
}
