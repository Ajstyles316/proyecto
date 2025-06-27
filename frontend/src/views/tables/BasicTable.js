import { Box, Typography, Card, CardContent } from "@mui/material";
import MaquinariaList from "../dashboard/components/Maquinaria/MaquinariaMain";

const BasicTable = () => {
  return (
    <Box>
      <Card>
        <CardContent>
          
          <MaquinariaList />
        </CardContent>
      </Card>
    </Box>
  );
};

export default BasicTable;
