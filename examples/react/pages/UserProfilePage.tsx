import React from 'react';

interface UserProfileProps {
  userId: string;
  tab?: string;
}

const UserProfilePage: React.FC<UserProfileProps> = ({ userId, tab = 'profile', }) => {
    return (
        <div className="page user-profile-page">
            <h1>User Profile</h1>
            <div className="user-details">
                <h2>User ID: {userId}</h2>
                <p>Current tab: {tab}</p>
            </div>
        </div>
    );
};

export default UserProfilePage;