import { useAuth } from '../../../services/auth';

function ProfileView() {
  const { user } = useAuth();
  
  return (
    <div className="dashboard-subview profile-view">
      <h2>Profile</h2>
      <p>{user?.displayName || 'User'}'s profile</p>
    </div>
  );
}

export default ProfileView;
