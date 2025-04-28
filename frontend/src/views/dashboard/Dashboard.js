import React from 'react';
import { Grid2 as Grid, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';

// components
import SalesOverview from './components/SalesOverview';

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid item size={{ xs: 12 }}>
            <SalesOverview />
          </Grid>
         

        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
