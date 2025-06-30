import React from 'react';
import { Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';


const AccountPage = () => {
  return (
    <PageContainer title="User Account" description="this is the user account page">

      <DashboardCard title="User Account">
        <Typography>This is the user account page</Typography>
      </DashboardCard>
    </PageContainer>
  );
};

export default AccountPage; 