import { Box, Card, CardContent } from '@mui/material';
import DepreciacionMain from '../dashboard/components/Depreciacion/DepreciacionMain';


const SamplePage = () => {
  return (
    <Box>
      <Card>
        <CardContent>
          <DepreciacionMain />
        </CardContent>
      </Card>
    </Box>
  );
};

export default SamplePage;
