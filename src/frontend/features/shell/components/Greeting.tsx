import { businessesService } from '@/frontend/features/businesses/services';

export const Greeting = () => {
  const business = businessesService.useBusiness();
  return (
    <div className="greeting">
      <span className="greeting-hello">Welcome back!</span>
      <span className="greeting-name">
        {business.name} <span aria-hidden>👋</span>
      </span>
    </div>
  );
};
