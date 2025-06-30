import React from 'react';
import { Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';


const ProfilePage = () => {
  return (
    <PageContainer title="User Profile" description="this is the user profile page">

      <DashboardCard title="User Profile">
        <Typography>This is the user profile page</Typography>
      </DashboardCard>
    </PageContainer>
  );
};

export default ProfilePage; 